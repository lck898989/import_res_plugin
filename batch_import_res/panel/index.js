// panel/index.js, this filename needs to match the one registered in package.json
const packageName = 'batch_import_res';
const fs = require('fire-fs');
const path = require('fire-path');
const Electron = require('electron');

const process = require('process');
const ChildProcess = require('child_process');


/**
 * 
 * 
 * 解压文件用到的工具
 * windows平台： unzip.exe
 * mac    平台： unzip
 * 
 * 
 * ** */
const unzipExe = Editor.url('packages://batch_import_res/tools/unzip.exe');
let Tool = Editor.require('packages://batch_import_res/tools/tool.js');


Editor.Panel.extend({
  // css style for panel
  style: fs.readFileSync(Editor.url("packages://batch_import_res/panel/index.css"),'utf-8'),

  // html template for panel
  template: fs.readFileSync(Editor.url("packages://batch_import_res/panel/index.html"),'utf-8'),

  $: {
    logTextArea: '#logTextArea'
  },

  // method executed when template and styles are successfully loaded and initialized
  ready () {
    let logCtrl = this.$logTextArea;
    let logListScrollToBottom = function () {
      setTimeout(function () {
          logCtrl.scrollTop = logCtrl.scrollHeight;
      }, 10);
    };
    new window.Vue({
      el: this.shadowRoot,
      data: {
        
        /** 资源位置可能为数组 */
        resPath    : '',
        
        /** 资源导入目标位置 */
        targetPath : Editor.Project.path + "/assets",

        log: "",

        /** 文件列表 */
        fileList: [],

        file: ''

      },
      methods: {
        /** 打开资源文件夹 */
        openSrc() {
          let res = Editor.Dialog.openFile({
            title: "选择要导入的资源文件",
            defaultPath: Editor.Project.path,
            filters: [
              {name: 'Custom File Type',extensions: ['zip']}
            ],
            properties: ['openFile','multiSelections']

          });
          if(res && res.length > 0) {
            Editor.log("res is ",res);
            this.resPath = res;
          }
        },

        /** 打开导入路径 */
        openTarget() {
          let res = Editor.Dialog.openFile({
            title: "选择要导入到的文件夹",
            defaultPath: Editor.Project.path,
            properties: ['openDirectory']

          });
          if(res && res.length > 0) {
            Editor.log("res is ",res);
            if(!fs.existsSync(res[0])) {
              this.addLog(this.log,res[0],'不存在！');
            } else {
              this.targetPath = res[0];
            }
          }
        },

        /** 开始导入资源 */
        async startImport() {
          Editor.log("targetpath and resPath is ",this.targetPath," ",this.resPath);
          if(this.targetPath && this.resPath) {
            Editor.log("/**************start uncompress**************/");

            /** 生成命令 */
            let cmd = '';
            this.targetPath = this.changePath(this.targetPath);

            /** 判断平台 */
            let resPath = this.changePath(path.join(Editor.url("packages://batch_import_res/tools"),'/unzip.exe'));
            let tempPath = "";

            for(let resItem of this.resPath) {

              if(process.platform === 'darwin') {
                // resItem.replace("\");
                cmd = "unzip " + " -o " + resItem + " -d " + this.targetPath;
              } else if(process.platform === 'win32') {
                tempPath = this.changePath(resItem);
                cmd = resPath + " -o" + " " + tempPath + " -d " + this.targetPath;
              }
              
              /** 执行命令 */
              let result = await this.execCmd(cmd);
              
              /** 写入日志 */
              if(result) {
                let ress = result.split("extracting: ");
                Editor.log("ress is ",ress);
                for(let i = 0; i < ress.length; i++) {
                  
                  let dirName = path.dirname(ress[i]);
                  let dirnameIndex = dirName.lastIndexOf('/');
                  let dirname = dirName.substr(dirnameIndex + 1);

                  this.addLog(ress[i],'');
                }
                this.addLog(tempPath,'解压成功！');
              } else {
                this.addLog(tempPath,'解压失败');
              }


            }
            await new Promise((reso,rej) => {
              Editor.assetdb.refresh('db://assets/',(err,results) => {
                Editor.log("刷新资源成功");
              })
            })
            
          } else {
            this.addLog("",'请选择导入文件夹和资源文件！');
          }

        },
        execCmd(cmd) {
          Editor.log("cmd is ",cmd);
          return new Promise((resolve,reject) => {
            ChildProcess.exec(cmd,null,(err,stdout,stderr) => {
              if(err) {
                reject(null);
                return;
              }
              resolve(stdout);
            })
        })  
        },
        /** 写入日志 */
        addLog(fileName,log) {
          let now = new Date();
          let nowStr = now.toLocaleString();
          this.log += `[${nowStr}]: ${fileName} ${log} \n`;

          logListScrollToBottom();

        },

        changePath(path) {
          return path.replace(/\\/g,'/');
        }
      }

    })
  },

  // register your ipc messages here
  messages: {
    'batch_import_res:hello' (event) {
      this.$label.innerText = 'Hello!';
    }
  }
});