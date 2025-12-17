# safe-solver Quick Start

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