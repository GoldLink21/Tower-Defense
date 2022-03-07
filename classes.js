function nextId(type='generic'){
    if(nextId["ID"+type]===undefined)
        nextId["ID"+type]=(function*(){var id=0;while(true)yield id++;})()
    return nextId["ID"+type].next().value
}
const Shapes={
    square:'square',
    circle:'circle',
    triangle:'triangle'
}

function Ent(){
    this.width=1;
    this.getWidth=function(){return this.width;}
    function a(){
        return 'A'
    }
}

var obj={
    foo:()=>'bar'
}

class Entity{
    constructor(x,y,width,height,color,{id=nextId("entity")}={}){
        this.color=color
        this.width=width
        this.height=height
        this.x=(x*Tn.SIZE+Tn.SIZE/2-width/2)
        this.y=(y*Tn.SIZE+Tn.SIZE/2-height/2)
        this.active=true
        this.toRemove=false
        this.id=id
        this.drawAng=0;

        this.shape=Shapes.square;
    }
    setDrawAng(deg){
        this.drawAng=Angle.toRad(deg)
        return this
    }
    withShape(shape){
        this.shape=shape
        return this
    }
    withId(val){
        this.id=val
        return this
    }
    withImg(img){
        this.img=img
        return this
    }
    setPosition(x,y){
        this.x=(x*Tn.SIZE+Tn.SIZE/2-this.width/2)
        this.y=(y*Tn.SIZE+Tn.SIZE/2-this.height/2)
        return this
    }
    draw(t){
        if(this.active){
            if(this.drawAng===0){
                ctx.fillStyle=this.color
                if(this.img){
                    g.img(this.img,this.x,this.y,this.width,this.height)
                }else if(this.shape===Shapes.circle){
                    g.oval(this.x,this.y,this.width,this.height)
                }else if(this.shape===Shapes.triangle){
                    g.triangle(this.x,this.y,this.width,this.height)
                }else{
                    g.rect(this.x,this.y,this.width,this.height)
                }
            }else{
                ctx.fillStyle=this.color
                
                g.drawAtRad(this.x+this.width/2,this.y+this.height/2,()=>{
                    if(this.img)
                        g.img(this.img,-this.width/2,-this.height/2,this.width,this.height)
                    else if(this.shape===Shapes.triangle)
                        g.triangle(-this.width/2,-this.height/2,this.width,this.height)
                    else if(this.shape===Shapes.circle)
                        g.oval(-this.width/2,-this.height/2,this.width,this.height)
                    else
                        g.rect(-this.width/2,-this.height/2,this.width,this.height)
                },this.drawAng)
            }
        }
    }
    move(){}
    getCorners(){
        return getRounded(this)
    }
    isCollide(other){
        return isCollide(this,other)
    }
    static moveAll(){
        for(let i=0;i<entities.length;i++){
            entities[i].move()
            if(entities[i].toRemove){
                entities.splice(i--,1);
            }
        }
    }
    setDraw(func){
        this.draw=func;
        return this
    }
    static distanceBetween(e1,e2){
        return Math.hypot((e2.x+e2.width/2)-(e1.x+e1.width/2),(e2.y+e2.height/2)-(e1.y+e1.height/2))
    }
    withSize(w,h){
        this.width=w
        this.height=h
    }
}

function a(deg=0){
    var tDeg=deg;
    var tRad=Angle.toRad(deg)
	return new class Ang{
        get deg(){return tDeg;}
        get rad(){return tRad;}
        set rad(val){
            tDeg=Angle.toDeg(val);
            tRad=val;
        }
        set deg(val){
            tRad=Angle.toRad(val);
            tDeg=val;
        }
    }
}

/**@type {Entity[]} */
var entities=[]

//#region Small-Classes
class Counter{
    /**
     * A class for counting times a thing happens and running a function after that
     * @param {number} max The max number of times the counter can count till it does onComplete
     * @param {function} onComplete The function to run once the counter is complete
     */
    constructor(max,onComplete=()=>{}){
        if(max<=0)
            throw new RangeError('Max count must be positive and greater than 0')
        this._max=max
        this._cur=0
        this.onComplete=onComplete
    }
    count(n=1){
        this.cur+=n
        return this
    }
    reset(){
        this.cur=0;
        return this
    }
    toString(){
        return this.cur+'/'+this.max
    }
    set cur(val){
        this._cur=val
        while(this._cur>=this._max){
            this._cur-=this._max
            this.onComplete()
        }
    }
    set max(val){
        if(val<=0)
            throw new RangeError('Max count must be poitive and greater than 0')
        this._max=val
        this.cur=this.cur
    }
    get cur(){return this._cur}
    get max(){return this._max}
}

/**Handles all the timing system. While it says milliseconds, it's actually in deciseconds to save on lag and precision */
var Clock1

class Clock{
    constructor(max,onComplete=()=>{}){
        this.milliseconds=0
        this.isPaused=false
        if(max){
            this.max=max
            this.onComplete=onComplete
        }
        this.start()
    }
    start(){
        if(!this.interval){
            this.isPaused=false
            var self=this
            this.interval=setInterval(()=>{
                self.milliseconds++;
                if(self.milliseconds>=self.max){
                    self.onComplete()
                    self.pause()
                }
            },10)
        }
    }
    pause(){
        clearInterval(this.interval);
        this.isPaused=true
        delete this.interval;
    }
    resume(){
        if(this.isPaused)this.start();
    }
    toString(){
        return Clock.parse(this.milliseconds)
    }
    static parse(milli){
        var sec=parseInt((milli/100)),
            min=parseInt(sec/60),
            mil=milli%100
        if(mil.toString().length===1)
            mil='0'+mil
        return min+':'+sec%60+'.'+mil
    }
    static unParse(str){
        var split=str.split(':'),
            t=split[1].split('.')
        return(parseInt(split[0]*6000)+parseInt(t[0]*100)+parseInt(t[1]))
    }
}

Clock1=new Clock()
//#endregion

//#region Enemy

/**Mostly used for positions in Enemy Movement. Short for vector */
function v(x=0,y=0){return {
    x:x,
    y:y,
    [Symbol.toPrimitive](){
        return "("+this.x+','+this.y+')'
    },
    add(other){
        return v(this.x+other.x,this.y+other.y)
    },
    sub(other){
        return this.add(other.flip())
    },
    flip(){
        return v(-this.x,-this.y)
    }
}}

class Path{
    constructor(...points){
        this.cur=0
        this.style=Path.styles.vertHoriz
        this.points=points
    }
    setStyle(style){
        this.style=style
        return this
    }
    flipStyle(){
        if(this.style===Path.styles.vertHoriz)
            this.style=Path.styles.horizVert
        else
            this.style=Path.styles.vertHoriz;

        return this
    }
    next(){
        this.cur++
        if(this.cur>=this.points.length)
            this.cur=this.points.length-1
        return this.points[this.cur]
    }
    add(...vects){
        vects.forEach(vect=>this.points.push(vect))
    }
    /**Tells if to go up/down then left/right or the other way around */
    static get styles(){return {vertHoriz:'vertHoriz',horizVert:'horizVert'}}
    static clone(other){
        return new Path(...other.points).setStyle(other.style)
    }
    getAllPoints(){

        var pointsOut=[this.points[0]]

        for(let i=0;i<this.points.length-1;i++){
            var firstPoint=this.points[i]
            var nextPoint=this.points[i+1]

            //Get all x's and y's between the two points
            var dx=aR(firstPoint.x,nextPoint.x)
            var dy=aR(firstPoint.y,nextPoint.y)

            if(this.style===Path.styles.horizVert){
                //Horiz then vert
                //Ignore first point
                dx.splice(1)
                    //Pair into points
                    .map(x=>v(x,firstPoint.y))
                    //Add to output
                    .forEach(v=>pointsOut.push(v))
                //Repeat for y
                dy.splice(1)
                    .map(y=>v(nextPoint.x,y))
                    .forEach(v=>pointsOut.push(v))
            }else if(this.style===Path.styles.vertHoriz){
                //Vert then Horiz
                dy.splice(1)
                    .map(y=>v(firstPoint.x,y))
                    .forEach(v=>pointsOut.push(v))
                dx.splice(1)
                    .map(x=>v(x,nextPoint.y))
                    .forEach(v=>pointsOut.push(v))
            }           
        }
        return pointsOut
    }
}

var mapPath=new Path(v(0,0),v(1,2),v(2,0))

class Enemy extends Entity{
    constructor(hp){
        super(mapPath.points[0].x,mapPath.points[0].y,15,15,'crimson')

        this.maxHp=hp;
        this.hp=hp;

        this.setPath(mapPath)

        this.curGoal=this.path.points[0]
        this.lastGoal=this.path.points[this.path.points.length-1];
        
        //Used to stop from deleting the enemy on the first tick because of unset pathing
        this.firstTick=true

        this.damage=5

        this.speed=2
        //Becomes false at end of moving to one point
        this.isMoving=true
        this.isAtEnd=false
        
        this.dx=0
        this.dy=0
        entities.push(this)
        this.reward=5;
        this.distance=0;
    }
    setReward(val){
        this.reward=val
        return this;
    }
    setPath(path){
        this.path=Path.clone(path)
    }
    move(){
        this.glideTo(this.curGoal.x,this.curGoal.y)
        //Pick a new point if not moving after gliding
        if(!this.isMoving){
            this.curGoal=this.path.next()
            if(this.curGoal.x===this.lastGoal.x&&this.curGoal.y===this.lastGoal.y){
                if(this.firstTick)
                    this.firstTick=false
                else
                    this.isAtEnd=true
            }
        }
    }
    withStyle(style){
        this.path.style=style
        return this
    }
    withDamage(damage){
        this.damage=damage;
        return this
    }
    withSpeed(spd){
        this.speed=spd;
        return this;
    }
    withColor(color){
        this.color=color
        return this
    }
    withSize(width,height){
        this.width=width;
        this.height=height;
        return this
    }
    glideTo(x,y){
        var urp=unroundPoint(x,y,this)
        var t=this
        function m2(xy){
            t.isMoving=true
            if(t[xy]<urp[xy]){
                t[xy]+=t.speed
                if(t[xy]>urp[xy])
                    t[xy]=urp[xy]
            }else{
                t[xy]-=t.speed
                if(t[xy]<urp[xy])
                    t[xy]=urp[xy]
            }     
            t.distance+=t.speed       
        }
        if(this.path.style===Path.styles.horizVert){
            if(this.x!==urp.x)
                m2('x')
            else if(this.y!==urp.y)
                m2('y')
            else{
                this.isMoving=false
            }
        }else if(this.path.style===Path.styles.vertHoriz){
            if(this.y!==urp.y)
                m2('y')
            else if(this.x!==urp.x)
                m2('x')
            else{
                this.isMoving=false
            }
        }
    }
    hurt(dmg){
        this.hp-=dmg;
        if(this.hp<=0){
            this.toRemove=true;
            this.onDeath(this)
        }
    }
    static checkAllCollide(){
        for(let i=0;i<entities.length;i++){
            var ent=entities[i]
            if(ent.constructor.name==='Enemy'){
                if(ent.isAtEnd){
                    player.hp-=ent.damage
                    entities.splice(i--,1)
                }
            }
        }
    }
    onDeath(t){}
    setOnDeath(func){this.onDeath=func}
    static Basic(){
        return new Enemy(10)
            .withSpeed(1)
            .withDamage(5)
    }
    static Heavy(){
        return new Enemy(30)
            .withSpeed(0.75)
            .withDamage(15)
            .withColor('gray')
            
    }
    baby(){
        var ret=new Enemy(this.maxHp)
        ret.path=Path.clone(this.path)
        ret.path.cur=this.path.cur
        ret.curGoal=this.curGoal
        ret.lastGoal=this.lastGoal
        ret.x=this.x
        ret.y=this.y
        return ret
    }
}
//#endregion

//Holds player stats
var player={
    hp:100,
    maxHp:100,
    money:0
}

class Wave{
    static cur
    static waves=[]
    static curNum=0;
    constructor(){
        /**@type {} */
        this.enemies={}
        this.maxTime=0;
        this.curTime=0;
        this.counter=undefined;
        this.over=false
    }
    /**@param {function():Enemy} enemy */
    add(enemy,time){
        if(time>this.max)
            this.maxTime=time;
        
        this.enemies[time]=enemy
        return this
    }
    /**@param {function():Enemy} enemy */
    multi(enemy,number,start,rate){
        for(let i=0;i<number;i++){
            this.add(enemy,start+rate*i)
        }
        return this
    }
    isOver(){
        return this.curTime>=this.maxTime&&(entities.find(e=>e.constructor.name==="Enemy")===undefined)
    }
    tick(){
        if(this.over)
            return;

        this.curTime++;
        if(this.enemies[this.curTime])
            this.enemies[this.curTime]();
        if(this.isOver())
            this.over=true;
    }
    start(){
        Wave.cur=this
    }
    static next(){
        if(Wave.cur&&Wave.cur.over){
            Wave.curNum++;
            Wave.waves[Wave.curNum].start()
        }
    }
}
var curWave=0;
var waves=[new Wave().multi(Enemy.Basic,10,1,6).multi(Enemy.Heavy,10,4,6)]
