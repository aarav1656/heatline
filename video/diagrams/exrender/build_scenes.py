#!/usr/bin/env python3
"""Generate the three .excalidraw scenes for the Order to Correct demo video.
Palette from DESIGN.md. A transparent 1920x1080 frame element makes the export
bbox exactly 16:9 so exportToBlob at 1920x1080 scale 1 is pixel-for-pixel."""
import json, random, sys, os

PAPER="#ffffff"; INK="#000000"; MUTED="#757575"; SUBTLE="#b3b3b3"; HAIR="#e0e0e0"
ACCENT="#b91c1c"; RELIABLE="#166534"; WATCH="#92400e"; OUT="#991b1b"; SIM="#6c2bd9"
W,H=1920,1080
rnd=random.Random(20260904); _n=[0]

def _base(kind,x,y,w,h,**kw):
    _n[0]+=1
    return {"id":f"e{_n[0]:03d}","type":kind,"x":round(x,2),"y":round(y,2),
      "width":round(w,2),"height":round(h,2),"angle":0,
      "strokeColor":kw.get("stroke",INK),"backgroundColor":kw.get("bg","transparent"),
      "fillStyle":kw.get("fillStyle","solid"),"strokeWidth":kw.get("strokeWidth",2),
      "strokeStyle":kw.get("strokeStyle","solid"),"roughness":0,"opacity":kw.get("opacity",100),
      "groupIds":[],"frameId":None,"index":f"a{_n[0]:03d}","roundness":None,
      "seed":rnd.randint(1,2**31),"version":1,"versionNonce":rnd.randint(1,2**31),
      "isDeleted":False,"boundElements":None,"updated":1756900000000,"link":None,"locked":False}

def rect(x,y,w,h,**kw): return _base("rectangle",x,y,w,h,**kw)
def ellipse(x,y,w,h,**kw): return _base("ellipse",x,y,w,h,**kw)

def line(x1,y1,x2,y2,**kw):
    e=_base("line",x1,y1,abs(x2-x1),abs(y2-y1),**kw)
    e.update({"points":[[0,0],[x2-x1,y2-y1]],"lastCommittedPoint":None,
      "startBinding":None,"endBinding":None,"startArrowhead":None,"endArrowhead":None})
    return e

def arrow(x1,y1,x2,y2,both=False,**kw):
    e=line(x1,y1,x2,y2,**kw)
    e["type"]="arrow"; e["endArrowhead"]="arrow"
    e["startArrowhead"]="arrow" if both else None; e["elbowed"]=False
    return e

CHAR_W=0.53
def text(s,x,y,size=24,color=INK,align="center",w=None):
    lines=s.split("\n")
    width=w if w is not None else max(len(l) for l in lines)*size*CHAR_W
    height=len(lines)*size*1.25
    left=x-width/2 if align=="center" else x
    e=_base("text",left,y,width,height,stroke=color,strokeWidth=1)
    e.update({"fontSize":size,"fontFamily":1,"text":s,"originalText":s,"textAlign":align,
      "verticalAlign":"top","containerId":None,"lineHeight":1.25,"autoResize":True})
    return e

def frame(): return rect(0,0,W,H,stroke="transparent",bg="transparent",strokeWidth=1)
def cross(cx,cy,r=17,color=OUT,sw=3):
    return [line(cx-r,cy-r,cx+r,cy+r,stroke=color,strokeWidth=sw),
            line(cx+r,cy-r,cx-r,cy+r,stroke=color,strokeWidth=sw)]
def eyebrow(t): return text(t,76,48,26,SUBTLE,align="left")

def scene_problem():
    el=[frame(),eyebrow("ORDER TO CORRECT  /  THE PROBLEM")]
    el.append(rect(76,130,640,470,stroke=INK,strokeWidth=2))
    el.append(text("2315 BARNES AVENUE, BRONX",396,152,28,INK))
    el.append(rect(120,230,270,200,stroke=OUT,strokeWidth=3))
    el.append(text("52F",255,254,58,OUT))
    el.append(text("7AM",255,326,30,OUT))
    el.append(text("eleven mornings straight",255,384,18,OUT))
    el.append(text("102",506,232,64,INK))
    el.append(text("open class C violations",506,306,20,MUTED))
    el.append(text("601",506,364,64,ACCENT))
    el.append(text("days oldest open",506,438,20,MUTED))
    el.append(line(120,470,646,470,stroke=HAIR,strokeWidth=2))
    el.append(text("TENANT",506,672,28,INK))
    el.append(text("knows something is wrong,\nnot the code section or the paperwork",506,712,19,MUTED))
    el.append(ellipse(474,528,52,52,stroke=INK,strokeWidth=2))
    el.append(line(500,582,500,644,stroke=INK,strokeWidth=2))
    el.append(line(500,600,552,618,stroke=INK,strokeWidth=2))
    el.append(line(500,644,556,656,stroke=INK,strokeWidth=2))
    el.append(rect(150,760,150,220,stroke=INK,strokeWidth=2))
    el.append(text("?",225,824,100,INK))
    el.append(text("LANDLORD",470,772,26,INK))
    el.append(text("stopped answering in January",470,814,20,MUTED))
    el.append(line(792,130,792,940,stroke=HAIR,strokeWidth=3,strokeStyle="dashed"))
    def source(y,title,s1,s2):
        o=[rect(940,y,904,190,stroke=INK,strokeWidth=2)]
        o.append(text(title,976,y+26,30,INK,align="left"))
        o.append(text(s1,976,y+76,21,MUTED,align="left"))
        o.append(text(s2,976,y+118,21,SUBTLE,align="left"))
        o.append(arrow(936,y+95,852,y+95,stroke=INK,strokeWidth=2))
        return o
    el+=source(130,"HPD VIOLATIONS RECORD",
        "data.cityofnewyork.us wvxf-dwi5",
        "already on file. nobody handed it to the tenant.")
    el+=source(360,"ADVOCATE'S CASELOAD",
        "hours per petition across HPD Online, 311, ACRIS",
        "rebuilds this history by hand, every time.")
    el+=source(590,"NO SHARED RECORD",
        "tenant and advocate work from different pages",
        "the file exists. nothing reads it for them.")
    el.append(text("The city already had a file on this building",960,972,42,INK))
    return el

def scene_pipeline():
    el=[frame(),eyebrow("ORDER TO CORRECT  /  THE PIPELINE")]
    def src(y,title,sub,fig):
        o=[rect(76,y,430,176,stroke=INK,strokeWidth=2)]
        o.append(text(title,106,y+22,26,INK,align="left"))
        o.append(text(sub,106,y+62,20,MUTED,align="left"))
        o.append(text(fig,106,y+106,22,ACCENT,align="left"))
        return o
    el+=src(120,"HPD VIOLATIONS","wvxf-dwi5  ·  class C heat","per-BBL history")
    el+=src(340,"HPD COMPLAINTS + PROBLEMS","uwyv-629c  /  a2nx-4u46","heat calls by season")
    el+=src(560,"311 SERVICE REQUESTS","erm2-nwe9","open heat/hot water cases")
    el+=src(780,"HPD REGISTRATIONS","tesw-yqqr","owner, portfolio size")
    el.append(arrow(510,208,618,412,stroke=INK,strokeWidth=2))
    el.append(arrow(510,428,618,460,stroke=INK,strokeWidth=2))
    el.append(arrow(510,648,618,508,stroke=INK,strokeWidth=2))
    el.append(arrow(510,868,618,556,stroke=INK,strokeWidth=2))
    el.append(text("SODA",560,300,22,ACCENT))
    el.append(rect(622,300,388,420,stroke=INK,strokeWidth=3))
    el.append(text("BUILDING RECORD",816,326,28,INK))
    el.append(text("one index per BBL",816,368,19,SUBTLE))
    el.append(text("102 open class C",658,420,22,MUTED,align="left"))
    el.append(text("601 days oldest open",658,460,22,MUTED,align="left"))
    el.append(text("owner + portfolio",658,500,22,MUTED,align="left"))
    el.append(line(658,544,974,544,stroke=HAIR,strokeWidth=1))
    el.append(text("SODA URL kept beside",658,562,19,SUBTLE,align="left"))
    el.append(text("every number on the page",658,588,19,SUBTLE,align="left"))
    el.append(arrow(1014,510,1106,510,stroke=INK,strokeWidth=2))
    el.append(text("gates",1060,462,24,ACCENT))
    el.append(rect(1110,320,404,380,stroke=INK,strokeWidth=3))
    el.append(text("TOOLS PER ROLE",1312,346,28,INK))
    el.append(text("TENANT",1150,402,24,INK,align="left"))
    el.append(text("log_condition · file_packet",1150,436,19,MUTED,align="left"))
    el.append(text("draft_311_complaint",1150,464,19,MUTED,align="left"))
    el.append(line(1150,504,1478,504,stroke=HAIR,strokeWidth=1))
    el.append(text("ADVOCATE",1150,522,24,ACCENT,align="left"))
    el.append(text("request_evidence",1150,556,19,MUTED,align="left"))
    el.append(text("assemble_hp_action_packet",1150,584,19,MUTED,align="left"))
    el.append(text("Every write re-checked server side",960,952,32,INK))
    return el

def scene_two():
    el=[frame(),eyebrow("ORDER TO CORRECT  /  TWO AGENTS, ONE CASE")]
    el.append(rect(560,102,800,66,stroke=HAIR,strokeWidth=2))
    el.append(text("order-to-correct.vercel.app / case / <id>",960,120,26,INK))
    def window(x,title,sub,tools,gone,cx,color):
        o=[rect(x,232,700,556,stroke=INK,strokeWidth=3)]
        o.append(line(x,314,x+700,314,stroke=INK,strokeWidth=2))
        o.append(text(title,cx,250,40,color))
        o.append(text(sub,cx,328,21,SUBTLE))
        y=380
        for t in tools:
            o.append(text(t,x+46,y,26,INK,align="left")); y+=48
        o.append(text(gone,x+46,y+4,26,SUBTLE,align="left"))
        gw=len(gone)*26*CHAR_W
        o.append(line(x+38,y+22,x+54+gw,y+22,stroke=OUT,strokeWidth=3))
        o.append(text("not registered for this role",x+46,y+44,19,OUT,align="left"))
        return o
    el+=window(76,"TENANT","?k=<owner key>   ·   9 tools registered",
        ["log_condition","match_condition_to_code","file_packet",
         "draft_311_complaint (form)","share_case","add_note"],
        "assemble_hp_action_packet",426,INK)
    el+=window(1144,"ADVOCATE","?k=<partner key>   ·   9 tools registered",
        ["assemble_hp_action_packet","request_evidence","add_note",
         "building_violation_history","compare_to_block"],
        "file_packet",1494,ACCENT)
    el.append(rect(856,420,208,208,stroke=ACCENT,strokeWidth=3))
    el.append(text("SHARED\nCASE\nSTATE",960,452,28,ACCENT))
    el.append(arrow(780,524,852,524,both=True,stroke=ACCENT,strokeWidth=2))
    el.append(arrow(1068,524,1140,524,both=True,stroke=ACCENT,strokeWidth=2))
    el.append(text("role comes from the capability key in the URL, never a self-declared label",960,638,18,SUBTLE))
    el.append(arrow(960,668,960,872,stroke=ACCENT,strokeWidth=2))
    el.append(text("server re-checks the role on every write",960,880,28,ACCENT))
    el.append(text("Same case, different tools, a person confirms every write",960,948,30,INK))
    return el

SCENES={"problem":scene_problem,"pipeline":scene_pipeline,"two-sessions":scene_two}

def main():
    outdir=sys.argv[1] if len(sys.argv)>1 else "."
    os.makedirs(outdir,exist_ok=True)
    for name,fn in SCENES.items():
        _n[0]=0
        scene={"type":"excalidraw","version":2,
          "source":"order-to-correct/docs/diagrams/build_scenes.py",
          "elements":fn(),
          "appState":{"gridSize":None,"viewBackgroundColor":PAPER,"exportBackground":True,
            "exportWithDarkMode":False,"exportEmbedScene":False,"exportScale":1},
          "files":{}}
        p=os.path.join(outdir,f"{name}.excalidraw")
        json.dump(scene,open(p,"w"),indent=1)
        print(p,len(scene["elements"]),"elements")

main()
