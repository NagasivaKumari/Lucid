from pathlib import Path

path = Path("contracts/donation_pool.py")
lines = path.read_text().splitlines()
print("total", len(lines))
markers = ["donate = Seq(", "set_minimum = Seq(", "withdraw = Seq("]
for marker in markers:
    for idx, line in enumerate(lines, 1):
        if marker in line:
            print(marker, idx)
            break
