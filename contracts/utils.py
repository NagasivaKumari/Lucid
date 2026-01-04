"""
Module: utils.py
Description: Implementation of utils.py for Lucid project.
"""

from pyteal import Expr, WideRatio


def share_for_weight(total_amount: Expr, weight: Expr, total_weight: Expr) -> Expr:
    """Return the proportional share for a weight using WideRatio for safety."""
    return WideRatio([total_amount, weight], [total_weight])
