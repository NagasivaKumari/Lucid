from contracts.donation_pool import approval_program, clear_state_program
from pyteal import compileTeal, Mode, TealType

def test_donation_pool_compilation():
    approval = approval_program()
    clear = clear_state_program()
    
    assert compileTeal(approval, mode=Mode.Application, version=6)
    assert compileTeal(clear, mode=Mode.Application, version=6)
