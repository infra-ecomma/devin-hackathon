import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { Planet, SpineStep, OrrerySettings, DEFAULT_SETTINGS } from '../types';

export class StateManager {
  private file: string;
  constructor(private ctx: vscode.ExtensionContext){
    this.file=path.join(ctx.globalStorageUri.fsPath,'tellurion.json');
    if(!fs.existsSync(path.dirname(this.file)))fs.mkdirSync(path.dirname(this.file),{recursive:true});
  }
  load(){try{return JSON.parse(fs.readFileSync(this.file,'utf-8'));}catch{return{planets:[],spine:[],settings:{...DEFAULT_SETTINGS}};}}
  save(s:any){fs.writeFileSync(this.file,JSON.stringify(s,null,2));}
  savePlanets(p:Planet[]){const s=this.load();s.planets=p;this.save(s);}
  saveSpine(sp:SpineStep[]){const s=this.load();s.spine=sp;this.save(s);}
  saveSettings(o:Partial<OrrerySettings>){const s=this.load();s.settings={...s.settings,...o};this.save(s);}
  markVerified(planetId:string,moonId?:string){
    const s=this.load(),p=s.planets.find((x:any)=>x.id===planetId);
    if(p){p.verified=true;if(moonId&&p.moons){const m=p.moons.find((x:any)=>x.id===moonId);if(m)m.verified=true;}this.save(s);}
  }
  advance(stepId:string){
    const s=this.load(),st=s.spine.find((x:any)=>x.id===stepId);if(!st)return;
    if(st.status==='pending'){st.status='active';st.progress=10;}
    else if(st.status==='active'){st.progress+=30;if(st.progress>=100){st.status='completed';const i=s.spine.findIndex((x:any)=>x.id===stepId);if(i>=0&&i<s.spine.length-1){s.spine[i+1].status='active';s.spine[i+1].progress=5;}}}
    this.save(s);
  }
}
