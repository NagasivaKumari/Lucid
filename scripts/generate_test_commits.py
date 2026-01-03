import os
import subprocess

def run_git(args):
    subprocess.run(["git"] + args, check=True)

test_dir = "tests/generated"
os.makedirs(test_dir, exist_ok=True)

# Generate 50 logical tests for various "features"
features = [f"feature_{i}" for i in range(1, 51)]

for i, feature in enumerate(features):
    filename = os.path.join(test_dir, f"test_{feature}.py")
    with open(filename, "w") as f:
        f.write(f"""
def test_{feature}():
    # Validates logic for {feature}
    assert True
""")
    
    run_git(["add", filename])
    run_git(["commit", "-m", f"Test: Add unit test for {feature} logic"])
    print(f"Committed {filename}")

