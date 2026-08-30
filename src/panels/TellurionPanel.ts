import * as vscode from "vscode";
import { ProjectScanner } from '../core/ProjectScanner';
import { BrandingAdapter } from '../core/BrandingAdapter';
import { StateManager } from '../core/StateManager';
import * as path from 'path'; import * as fs from 'fs';

export interface ToWebview{type:'init'|'refresh'|'inceptionComplete'|'pushState';planets?:any[];spine?:any[];brand?:any;message?:string;settings?:any;}
export interface FromWebview{type:'ready'|'startInception'|'planetClick'|'moonClick'|'spineAdvance'|'settingChange'|'verifyPlanet'|'verifyMoon';planetId?:string;moonId?:string;stepId?:string;settings?:any;}

export class TellurionPanel {
  private panel: vscode.WebviewPanel;
  constructor(private ctx: vscode.ExtensionContext, private scanner: ProjectScanner, private inception: any, private brandAdapter: BrandingAdapter, private state: StateManager, private onDisposed?: ()=>void){
    this.panel=vscode.window.createWebviewPanel('tellurion.orrery','Tellurion Orrery',vscode.ViewColumn.Two,{enableScripts:true,retainContextWhenHidden:true,localResourceRoots:[vscode.Uri.file(path.join(ctx.extensionUri.fsPath,'media'))]});
    this.panel.webview.html=this.getHtml();
    this.panel.webview.onDidReceiveMessage(async(msg:FromWebview)=>{this.handleMsg(msg);});
    this.panel.onDidDispose(()=>this.dispose(),null,this.ctx.subscriptions);
  }
  reveal(){this.panel.reveal(vscode.ViewColumn.Two);}
  sendMessage(msg:ToWebview){this.panel.webview.postMessage(msg);}
  private pushState(){
    const s=this.state.load();
    this.sendMessage({type:'pushState',planets:s.planets||[],spine:s.spine||[],settings:s.settings||{}});
  }
  private async handleMsg(msg:FromWebview){
    switch(msg.type){
      case 'ready': this.pushState(); break;
      case 'verifyPlanet': if(msg.planetId){this.state.markVerified(msg.planetId);} break;
      case 'verifyMoon': if(msg.planetId){this.state.markVerified(msg.planetId,msg.moonId);} break;
      case 'spineAdvance': if(msg.stepId){this.state.advance(msg.stepId); this.pushState();} break;
      case 'settingChange': if(msg.settings){this.state.saveSettings(msg.settings);} break;
    }
  }
  private getHtml():string{
    const bundled=path.join(this.ctx.extensionUri.fsPath,'media','tellurion-bundled.html');
    const html=path.join(this.ctx.extensionUri.fsPath,'media','tellurion.html');
    if(fs.existsSync(bundled))return fs.readFileSync(bundled,'utf-8');
    if(fs.existsSync(html))return fs.readFileSync(html,'utf-8');
    return "<html><body style=\"background:#060a14;color:#c8d6e5;display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui\"><h1>Tellurion</h1></body></html>";
  }
  dispose(){this.panel.dispose();this.onDisposed?.();}
}
