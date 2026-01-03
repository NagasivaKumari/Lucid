"""PyTeal implementation of the UMIS engine that regulates opt-in weights
and pays out proportional distributions via inner payments."""

from pyteal import *
from pyteal import TxnType
from contracts.utils import share_for_weight

# UMIS Engine: registration + weighted distribution
# Local state keys:
# - "weight" : uint64 weight for each opted-in account (default 1)
# Global keys:
# - "Owner" : creator address (set on creation)

OWNER_KEY = Bytes("Owner")  # stored at creation; controls withdrawals and remainders
WEIGHT_KEY = Bytes("weight")  # per-account weight used during payout allocation
OPT_IN_COUNT_KEY = Bytes("opt_in_count")  # counter for opted-in accounts

MIN_WEIGHT = Int(1)
MAX_WEIGHT = Int(1_000_000)


def send_payment(receiver: Expr, amount: Expr, memo: Expr = None) -> Expr:
    """Emit an inner payment to the receiver and optionally attach a memo."""
    fields = {
        TxnField.type_enum: TxnType.Payment,
        TxnField.receiver: receiver,
        TxnField.amount: amount,
    }
    if memo is not None:
        fields[TxnField.note] = memo
    return Seq(
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields(fields),
        InnerTxnBuilder.Submit(),
    )


def approval_program():
    """Builds the approval logic that handles opt-in, weight updates, and distribute."""
    i = ScratchVar(TealType.uint64)
    n = ScratchVar(TealType.uint64)
    total_amount = ScratchVar(TealType.uint64)
    total_weight = ScratchVar(TealType.uint64)
    weight = ScratchVar(TealType.uint64)
    w = ScratchVar(TealType.uint64)
    share = ScratchVar(TealType.uint64)
    remainder = ScratchVar(TealType.uint64)
    distributed_amount = ScratchVar(TealType.uint64)

    on_create = Seq([
        App.globalPut(OWNER_KEY, Txn.sender()),
        App.globalPut(OPT_IN_COUNT_KEY, Int(0)),
        Approve(),
    ])

    # Opt-in: set initial weight to 1
    on_opt_in = Seq([
        App.localPut(Txn.sender(), WEIGHT_KEY, Int(1)),
        App.globalPut(OPT_IN_COUNT_KEY, App.globalGet(OPT_IN_COUNT_KEY) + Int(1)),
        Approve(),
    ])

    # CloseOut & ClearState: just approve for now
    on_closeout = Approve()
    on_clear = Approve()

    # Allow user to set their own weight: args = ["set_weight", <weight>]
    set_weight = Seq(
        [
            Assert(Txn.application_args.length() == Int(2)),
            Assert(Len(Txn.application_args[1]) > Int(0)),
            weight.store(Btoi(Txn.application_args[1])),
            Assert(weight.load() >= MIN_WEIGHT),
            Assert(weight.load() <= MAX_WEIGHT),
            App.localPut(Txn.sender(), WEIGHT_KEY, weight.load()),
            Approve(),
        ]
    )

    # Distribute funds proportionally by local weight
    # Expects group of 2 txns: Gtxn[0] payment to app address, Gtxn[1] this app call
    distribute = Seq(
        Assert(Global.group_size() == Int(2)),
        Assert(Gtxn[0].type_enum() == TxnType.Payment),
        Assert(Gtxn[1].type_enum() == TxnType.ApplicationCall),
        Assert(Gtxn[0].receiver() == Global.current_application_address()),
        # number of recipients passed in Txn.accounts (exclude sender at index 0)
        n.store(Txn.accounts.length() - Int(1)),
        Assert(n.load() > Int(0)),
        total_amount.store(Gtxn[0].amount()),
        # compute total weight
        total_weight.store(Int(0)),
        # Ensure every recipient has opted in before computing totals
        i.store(Int(1)),
        For(i.store(Int(1)), i.load() <= n.load(), i.store(i.load() + Int(1))).Do(
            Assert(App.localGet(Txn.accounts[i.load()], WEIGHT_KEY) >= MIN_WEIGHT)
        ),
        i.store(Int(1)),
        For(i.store(Int(1)), i.load() <= n.load(), i.store(i.load() + Int(1))).Do(
            Seq(
                w.store(App.localGet(Txn.accounts[i.load()], WEIGHT_KEY)),
                # If account not opted-in, weight will be 0 -> reject
                Assert(w.load() >= MIN_WEIGHT),
                total_weight.store(total_weight.load() + w.load()),
            )
        ),
        Assert(total_weight.load() > Int(0)),
        distributed_amount.store(Int(0)),
        # For each recipient, send share = total_amount * weight / total_weight
        i.store(Int(1)),
        For(i.store(Int(1)), i.load() <= n.load(), i.store(i.load() + Int(1))).Do(
            Seq(
                w.store(App.localGet(Txn.accounts[i.load()], WEIGHT_KEY)),
                share.store(share_for_weight(total_amount.load(), w.load(), total_weight.load())),
                distributed_amount.store(distributed_amount.load() + share.load()),
                send_payment(Txn.accounts[i.load()], share.load()),
            )
        ),
        remainder.store(total_amount.load() - distributed_amount.load()),
        Assert(remainder.load() >= Int(0)),
        # Send any tiny leftover (due to division rounding) back to the owner
        If(remainder.load() > Int(0)).Then(
            send_payment(App.globalGet(OWNER_KEY), remainder.load()),
        ),
        Approve(),
    )

    # Owner withdraw: args = ["withdraw", <amount>]
    withdraw_amount = ScratchVar(TealType.uint64)
    withdraw = Seq(
        [
            Assert(Txn.sender() == App.globalGet(OWNER_KEY)),
            Assert(Txn.application_args.length() == Int(2)),
            withdraw_amount.store(Btoi(Txn.application_args[1])),
            Assert(withdraw_amount.load() > Int(0)),
            Assert(withdraw_amount.load() <= Balance(Global.current_application_address())),
            InnerTxnBuilder.Begin(),
            InnerTxnBuilder.SetFields({
                TxnField.type_enum: TxnType.Payment,
                TxnField.receiver: App.globalGet(OWNER_KEY),
                TxnField.amount: withdraw_amount.load(),
            }),
            InnerTxnBuilder.Submit(),
            Approve(),
        ]
    )

    handle_noop = Cond(
        [Txn.application_args.length() > Int(0), Cond(
            [Txn.application_args[0] == Bytes("set_weight"), set_weight],
            [Txn.application_args[0] == Bytes("distribute"), distribute],
            [Txn.application_args[0] == Bytes("withdraw"), withdraw],
        )],
        [Int(1), Reject()],
    )

    program = Cond(
        [Txn.application_id() == Int(0), on_create],
        [Txn.on_completion() == OnComplete.OptIn, on_opt_in],
        [Txn.on_completion() == OnComplete.CloseOut, on_closeout],
        [Txn.on_completion() == OnComplete.ClearState, on_clear],
        [Txn.on_completion() == OnComplete.DeleteApplication, Return(Txn.sender() == App.globalGet(OWNER_KEY))],
        [Txn.on_completion() == OnComplete.UpdateApplication, Return(Txn.sender() == App.globalGet(OWNER_KEY))],
        [Txn.on_completion() == OnComplete.NoOp, handle_noop],
    )

    return program


def clear_state_program():
    """Clears user state (no cleanup logic yet)."""
    return Approve()


if __name__ == "__main__":
    from pyteal import compileTeal, Mode
    with open("contracts/umis_engine_approval.teal", "w") as f:
        f.write(compileTeal(approval_program(), mode=Mode.Application, version=6))
    with open("contracts/umis_engine_clear.teal", "w") as f:
        f.write(compileTeal(clear_state_program(), mode=Mode.Application, version=6))
    print("Compiled umis_engine to TEAL files in contracts/")
