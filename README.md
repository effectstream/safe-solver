# Safe Solver Quick Start

<img width="1372" height="1312" alt="Screenshot 2025-12-17 at 7 39 13 PM" src="https://github.com/user-attachments/assets/386b3b6e-4d97-4e89-a4c8-75036f14f80a" />

```sh
# Check for external dependencies
./../check.sh

# Install packages
deno install --allow-scripts && ./patch.sh

# Compile contracts
deno task build:evm
deno task build:midnight

# TODO this can be ran after the first launch of the node
# deno task -f @my-project-all pgtyped:update

# Launch Paima Engine Node
deno task dev
```

Open [http://localhost:10599](http://localhost:10599)
