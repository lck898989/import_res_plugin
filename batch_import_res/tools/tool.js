
const EXE = require('child_process').exec;
// const Tool = {
//     /** 执行命令 */
//     execCmd: (cmd) => {
//         if(CC_EDITOR) {
//             Editor.log("cmd is ",cmd);
//         }
//         return new Promise((resolve,reject) => {
//             EXE(cmd,null,(err,stdout,stderr) => {
//                 if(err) {
//                     reject();
//                     return;
//                 }
//                 resolve();
//             })
//         })
//     }
// }
exports.execCmd = async (cmd) => {
    if(CC_EDITOR) {
        Editor.log("cmd is ",cmd);
    }
    return new Promise((resolve,reject) => {
        EXE(cmd,null,(err,stdout,stderr) => {
            if(err) {
                reject();
                return;
            }
            resolve();
        })
    })
}