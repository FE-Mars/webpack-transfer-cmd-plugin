# webpack-transfer-cmd-plugin
complie to CMD module

# Configuration

```
const TransferToCmdPlugin = require("webpack-transfer-cmd-plugin")
```

```
    plugins: [
        ...
        new TransferToCmdPlugin({
          entryOnly: true,    //if true, the plugin will only compile the entry chunks  （default: true）
          include_css: true   //if ture, CSS with the same name will be added to the entry chunks（default: true）
        })
        ...
    ]
```