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
      include_css: true,
      auto_load_depend: false, // 自动加载依赖模块
    }
    this.options = Object.assign({}, defaults, options);
  }

  apply(compiler){
    const options = this.options;
    compiler.hooks.emit.tap(pluginName, (compilation) => {
        // 检索每个（构建输出的）chunk：
      compilation.chunks.forEach((chunk) => {
        //入口文件都是默认首次加载的，即 canBeInitial为true 和 require.ensure 按需加载是完全不一样的
        // if(options.entryOnly && !chunk.canBeInitial()) return;
        if(options.entryOnly && !chunk.isOnlyInitial()) return;  //isOnlyInitial  https://github.com/webpack/webpack/blob/master/lib/Chunk.js#L411
        // 检索由 chunk 生成的每个资源(asset)文件名：
        chunk.files.forEach(function(filename) {
          if(/\.js$/.test(filename) && !/hot-update\.js$/.test(filename)){     //只处理js文件
            let js_source = compilation.assets[filename].source(), 
            css_source = '';
            if(options.include_css && hasCss(chunk.files, chunk.name)){    //需要包含css时
              css_source = `require('./${chunk.name}.css');`
            }
            let load_depend_module = '';
            if (options.auto_load_depend) {
              let name = filename.split('.')[0];
              let entrypoint = compilation.entrypoints.get(name);
              let library = typeof options.auto_load_depend === 'object' ? options.auto_load_depend.publicPath : compilation.outputOptions.library.toLowerCase();

              if (entrypoint && entrypoint.chunks && entrypoint.chunks.length) {
                let modules = [];

                entrypoint.chunks.forEach(item => {
                  if (item.name !== name) {
                    item.files.forEach(cItem => {
                      let ext = cItem.substring(cItem.lastIndexOf('.') + 1);

                      if (ext === 'js' || (options.include_css && ext === 'css')) {
                        modules.push(`require('${library}/${cItem}');`);
                      }
                    })
                  }
                });

                load_depend_module = modules.join('');
              }
            }
            let cmdSource = `define(function(require, exports, module){${load_depend_module}${js_source}${css_source}\n})`;
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