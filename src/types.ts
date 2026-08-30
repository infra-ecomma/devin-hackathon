export interface Planet {
  id:string; name:string; description:string; color:string;
  orbitRadius:number; speed:number; angle?:number; size:number;
  verified:boolean; moons?:Moon[]; _x?:number; _y?:number;
}
export interface Moon {
  id:string; name:string; color:string; orbitR:number; speed:number;
  angle?:number; size:number; verified:boolean; _x?:number; _y?:number;
}
export interface SpineStep {
  id:string; label:string; status:"pending"|"active"|"completed"|"failed"; progress:number;
}
export interface CensusEntry { category:string; count:number; details:{name:string;extensions:string[]}[]; }
export interface OrrerySettings { showOrbits:boolean;showLabels:boolean;zoom:number;showMoons:boolean;speedMultiplier:number;theme:"dark"|"deep"; }
export const DEFAULT_SETTINGS:OrrerySettings = {showOrbits:true,showLabels:true,zoom:1,showMoons:true,speedMultiplier:1,theme:"dark"};
export interface BrandConfig { name:string; colors:{primary:string;secondary:string;accent:string}; fonts:string; logoUrl?:string; }
