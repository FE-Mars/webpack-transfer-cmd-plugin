const pluginName = 'TransferToCmdPlugin';

function hasCss(files, name) {
  let reg = new RegExp(`^(${name}\\.)\.*(\\.css)$`)
  return !!files.find(file => {
    return reg.test(file);
  });
}

class TransferToCmdPlugin {
  constructor(options) {
    let defaults= {
      entryOnly: true,    //如果值为 true，将只对入口 chunks 文件做CMD处理
      include_css: true
    }
    this.options = Object.assign({}, defaults, options);
  }

  apply(compiler){
    const options = this.options;
    compiler.hooks.emit.tap(pluginName, (compilation) => {
        // 检索每个（构建输出的）chunk：
      compilation.chunks.forEach((chunk) => {
        //入口文件都是默认首次加载的，即 canBeInitial为true 和 require.ensure 按需加载是完全不一样的
        if(options.entryOnly && !chunk.canBeInitial()) return;
        // 检索由 chunk 生成的每个资源(asset)文件名：
        chunk.files.forEach(function(filename) {
          if(/\.js$/.test(filename) && !/hot-update\.js$/.test(filename)){     //只处理js文件
            let js_source = compilation.assets[filename].source(), 
            css_source = '';
            if(options.include_css && hasCss(chunk.files, chunk.name)){    //需要包含css时
              css_source = `require('./${chunk.name}.css');`
            }
            let cmdSource = `define(function(require, exports, module){${css_source}${js_source}\n})`;
            compilation.assets[filename] = {
              source: () => {
                return cmdSource;
              },
              size: () => {
                return cmdSource.length;
              }
            }
          }
        });
      });
    })
  }
}

module.exports = TransferToCmdPlugin;