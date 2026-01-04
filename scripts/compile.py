"""
Module: compile.py
Description: Implementation of compile.py for Lucid project.
"""

from pyteal import compileTeal, Mode
from contracts.donation_pool import approval_program, clear_state_program

if __name__ == "__main__":
    with open("contracts/donation_pool_approval.teal", "w") as f:
        f.write(compileTeal(approval_program(), mode=Mode.Application, version=6))

    with open("contracts/donation_pool_clear.teal", "w") as f:
        f.write(compileTeal(clear_state_program(), mode=Mode.Application, version=6))

    print("Compiled donation_pool to TEAL files in contracts/")