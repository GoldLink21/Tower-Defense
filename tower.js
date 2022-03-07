class TowerHead extends Entity{
    constructor(x,y,width,height,color,delay){
        super(x,y,width,height,color)
        this.tileX=x
        this.tileY=y

        this.stats=new Upgrades(true)
        this.stats.range=b(x,y).range;

        this.upgrades=new Upgrades()

        /**@type {Tower} */
        this.tile=b(x,y)

        this.ang=0;
        this.forwardShift=0;
        this.projFunc=()=>{}

        this.delayCounter=new Counter(delay,()=>this._delayCountFunc())
        new Projectile(this,1,1,'red',3,15,1)
        this.proj={
            width:5,height:5,color:'red',shape:Shapes.circle
        }
    }
    _delayCountFunc(){
        if(this.tile.target)
            this.fire()
    }
    setProjOnMove(func){
        this.projOnMove=func
        return this
    }
    setDelay(n){
        this.delayCounter.cur=0;
        this.delayCounter.max=n;
    }
    setDraw(func){
        this.otherDraw=func;
        return this;
    }
    setShift(val){
        this.forwardShift=val
        return this
    }
    draw(){
        drawAfter.set('tower('+this.tileX+','+this.tileY+')',()=>{
            ctx.save()
            ctx.translate((this.x+this.width/2)*scale,(this.y+this.height/2)*scale)
        
            ctx.rotate(this.ang)
            ctx.translate(0,-this.forwardShift*scale)

            this.otherDraw(this)

            ctx.restore()
        })
        
    }
    /**This.is with respect of the center of the head at (x+w/2,y+h/2) */
    otherDraw(t){
        g.rect(-this.width/2,-this.height/2,this.width,this.height,this.color)
        ctx.fillStyle=this.color
        ctx.fillRect(-this.width/2,-this.height/2,this.width,this.height)
    }
    /*
    setProjectile(projFunc){
        this.projFunc=projFunc;
        return this
    }*/
    setProjectile(width,height,color,speed,damage,spread,multi=1,spacedN=1,spacedSpace=0,shape=Shapes.circle){
        this.proj.width=width
        this.proj.height=height
        this.proj.color=color
        this.proj.shape=shape

        this.stats.speed=speed
        this.stats.damage=damage
        this.stats.spread=spread
        this.stats.multiAngled.n=spacedN;
        this.stats.multiAngled.space=spacedSpace
        this.stats.multi=multi
        return this
    }
    tryFire(){
        if(this.tile.target)
            this.delayCounter.count()
    }
    fire(){
        this.tile.faceTarget()
        entities.push(...this.makeProj())
        //entities.push(...flat([this.projFunc(this)]))
    }
    makeProj(){
        var t=this
        function run(val){
            return (typeof val==='function')?val(t):val;
        }
        return flat(
            new Projectile(this,
                run(this.proj.width),
                run(this.proj.height),
                run(this.proj.color),
                (run(this.stats.speed)-this.upgrades.speed.add)*this.upgrades.speed.mult,
                (run(this.stats.spread)-this.upgrades.spread),
                (run(this.stats.damage)+this.upgrades.damage.add)*this.upgrades.damage.mult
            )
            .withShape(this.proj.shape)
            .setOnMove(this.projOnMove)
            .cloneMulti(this.stats.multi+this.upgrades.multi)//Make copies up to how many there is
            .map(p=>
                p.multiAngled(
                    this.stats.multiAngled.n+this.upgrades.multiAngled.n,
                    this.stats.multiAngled.space+this.upgrades.multiAngled.space
                )
            )//Clones for every copy
        )
    }
    setMakeProj(func){
        this.makeProj=func
        return this;   
    }
}

function RectCircleColliding(circle,rect){
    var distX = Math.abs(circle.x - rect.x-rect.width/2);
    var distY = Math.abs(circle.y - rect.y-rect.height/2);

    if (distX > (rect.width/2 + circle.radius)) { return false; }
    if (distY > (rect.height/2 + circle.radius)) { return false; }

    if (distX <= (rect.width/2)) { return true; } 
    if (distY <= (rect.height/2)) { return true; }

    var dx=distX-rect.width/2;
    var dy=distY-rect.height/2;
    return (dx*dx+dy*dy<=(circle.radius*circle.radius));
}

const SearchStyles={
    first:'first',
    last:'last',
    close:'close',
    far:'far',
    strong:'strong',
    weak:'weak'
}

class Upgrades{
    constructor(isStats=false){
        /**Many bullets at once */
        this.multi=(isStats)?1:0;
        /**Subtracted by spread */
        this.spread=0;
        /**How many can be hit with one bullet */
        this.pierce=(isStats)?1:0;
        /**Speed of the bullet */
        this.speed=(isStats)?5:{mult:1,add:0};
        /**Many bullets spaced evenly */
        this.multiAngled={n:(isStats)?1:0,space:0}
        /**The range of the tower. Adds add then times by mult */
        this.range=(isStats)?2.5:{mult:1,add:0}
        /**The damage of the tower. Adds add then times by mult */
        this.damage=(isStats)?1:{mult:1,add:0}
        /**The rate the tower fires at. Adds add then divides by mult */
        this.fireRate=(isStats)?15:{mult:1,add:0}
    }
    get(stat){
        return this.upgrades[stat]
    }
    has(stat){
        if(typeof this.upgrades[stat]==='number')//Standard stats
            return this.upgrades[stat]!==0
        if(this.upgrades[stat].mult)//Stats with multipliers
            return this.upgrades[stat].mult!==0&&this.upgrades[stat].add!==0
        if(this.upgrades[stat].n) //Multi spaced
            return this.upgrades[stat].n!==0
        //Default
        return false;
    }
    set(stat,val){
        this[stat]=val;
        return this
    }
}

var u=new Upgrades().set(Upgrades.damage,2)

class Tower extends Tile{
    constructor(name,color,hasImage,otherProps){
        super('tower',color,hasImage,otherProps)
        //Must start with coords for placement of tower head
        this.towerName=name
        this.x=undefined;
        this.y=undefined;
        /**@type {TowerHead} */
        this.head=undefined;
        this.range=2*Tn.SIZE+Tn.SIZE/2;
        this.circ=this.getRangeCirc()
        /**@type {Enemy[]} */
        this.targets=[]
        /**@type {Enemy} */
        this.target=undefined;
        this.searchStyle=SearchStyles.first;
    }
    setRange(rng){
        this.range=rng*Tn.SIZE+Tn.SIZE/2
        this.circ=this.getRangeCirc()
        return this
    }
    setSearch(style){
        this.searchStyle=style
        return this;
    }
    setDeg(deg){
        if(this.head)
            this.head.ang=Angle.toRad(deg-90)
        return this
    }
    setHead(head){
        this.head=head;
        this.x=head.x;
        this.y=head.y
        this.circ=this.getRangeCirc()
        return this
    }
    findTargets(){
        this.targets=[]
        entities.forEach(e=>{
            //Only target enemies
            if(e.constructor.name!=='Enemy')
                return
            if(RectCircleColliding(this.circ,e))
                this.targets.push(e)
        })
        if(this.targets.length>0){
            //Find selected target, then face them
            var thisTower=this
            if(this.searchStyle===SearchStyles.first)//Good
                this.target=this.targets.reduce((v,e)=>(e.distance>v.distance)?e:v)
            else if(this.searchStyle===SearchStyles.last)//Good
               this.target=this.targets.reduce((v,e)=>(e.distance<v.distance)?e:v)
            else if(this.searchStyle===SearchStyles.close)
                this.target=this.targets.reduce((v,e)=>(Entity.distanceBetween(thisTower,e)<Entity.distanceBetween(thisTower,v))?e:v)
            else if(this.searchStyle===SearchStyles.far)
                this.target=this.targets.reduce((v,e)=>(Entity.distanceBetween(thisTower,e)>Entity.distanceBetween(thisTower,v))?e:v)
            else if(this.searchStyle===SearchStyles.strong)
                this.target=this.targets.reduce((v,e)=>(e.hp>v.hp)?e:v)
            else if(this.searchStyle===SearchStyles.weak)
                this.target=this.targets.reduce((v,e)=>(e.hp<v.hp)?e:v)
        }else 
            this.target=undefined
    }

    faceTarget(){
        var cent=v(this.circ.x,this.circ.y),
            tarCent=v(this.target.x+this.target.width/2,this.target.y+this.target.height/2)
        var d=cent.sub(tarCent)
        var ang=Math.atan2(d.y,d.x)
        this.setDeg(Angle.toDeg(ang))
    }
    getRangeCirc(x,y){
        if(this.x)
            return {x:this.x+this.head.width/2,y:this.y+this.head.height/2,radius:this.range}

        return {x:x*Tn.SIZE+Tn.SIZE/2,y:y*Tn.SIZE+Tn.SIZE/2,radius:this.range}
    }
    drawRadius(){
        ctx.fillStyle='rgba(0,0,0,0.4)'
        ctx.beginPath()
        ctx.arc(this.circ.x*scale,this.circ.y*scale,this.range*scale,0,Math.PI*2)
        ctx.fill()
        ctx.closePath()
    }
    onRemove(){
        drawAfter.remove('tower('+this.head.tileX+','+this.head.tileY+')')
    }
    draw(x,y){
        super.draw(x,y)
        this.findTargets()
        if(this.head){
            this.head.draw()
            this.head.tryFire()
        }
    }
}

class Projectile extends Entity{
    constructor(parent,width,height,color,speed,spread=5,damage=1){
        super(parent.tileX,parent.tileY,width,height,color)
        
        this.withShape(Shapes.circle);
        this.parent=parent
        this.speed=speed;
        this.steps=-1;

        this.hasHit=[]

        this.range=(parent.tile.range/this.speed)-parent.forwardShift/parent.tile.range
        this.spread=Angle.toRad(spread);
        this.ang=0;
        this.maxHits=1;
        this.curHits=0;

        this.damage=damage
        //Spread of the shot
        var dtheta=Math.random()*2*this.spread-this.spread

        var rad=Angle.roundRad(parent.ang)+dtheta;

        this.setAng(rad)
        this.setDrawAng(Angle.toDeg(rad))
        this.setSpeed(this.parent.height/2+this.parent.forwardShift/2+this.height/2)
        this.move(true)
        this.speed=speed;
        this.setAng(this.ang)
    }
    setSpeed(spd){
        this.speed=spd
        this.setAng(this.ang)
    }
    setMaxHits(n){
        this.maxHits=n;
        return this;
    }
    setMovement(dx,dy){
        this.dx=dx;
        this.dy=dy
        return this;
    }
    setAng(angInRad){
        this.ang=angInRad;
        this.dx=this.speed*Math.sin(-angInRad);
        this.dy=this.speed*Math.cos(-angInRad);
        return this
    }
    move(skipStep=false){
        this.x-=this.dx
        this.y-=this.dy
        if(!skipStep)
            this.steps++;
        if(this.steps>=this.range){
            this.toRemove=true
        }
        if(!skipStep)
            this.checkCollide()
        //this.setAng(-this.ang-Math.sin(this.steps))
        this.onMove(this)
    }
    onMove(){}
    setOnMove(func){
        this.onMove=func;
        return this
    }
    shiftPerp(d){
        var oldAng=this.ang,
            oldSpeed=this.speed;
        this.speed=d
        this.setAng(oldAng-Math.PI/2)
        this.move(true)
        this.speed=oldSpeed
        this.setAng(oldAng)
        return this
    }
    checkCollide(){
        for(let i=0;i<entities.length;i++){
            if(!this.toRemove&&entities[i].constructor.name==='Enemy'&&!this.hasHit.includes(entities[i])&&this.isCollide(entities[i])){
                entities[i].hurt(this.damage);
                //console.log('hurt to '+entities[i].hp)
                this.curHits++;
                this.hasHit.push(entities[i])
                if(this.curHits>=this.maxHits){
                    this.toRemove=true;
                    return;
                }
            }
        }
    }
    clone(){
        return new Projectile(this.parent,this.width,this.height,this.color,this.speed,Angle.toDeg(this.spread),this.damage).withShape(this.shape)
    }
    cloneMulti(n){
        if(n<=1)
            return [this.clone()]

        var ret=[]
        for(let i=0;i<n;i++)
            ret.push(this.clone())
        return ret
    }
    multiAngled(n,rangeInDeg){
        if(n<=1)
            return [this.clone()]
        var out=[],
            start=this.ang-Angle.toRad(rangeInDeg)/2
        var dr=Angle.toRad(rangeInDeg)/(n-1)
        for(let i=0;i<n;i++){
            out.push(this.clone().setAng(start+dr*i))
        } 
        return out
    }
}


class Towers{
    static Basic(x,y){
        return b(x,y,new Tower('basic','peru'))
            .setRange(2.5)
            .setHead(
                new TowerHead(x,y,5,15,'silver',12)
                    .setShift(Tn.SIZE/2)
                    .setDraw(t=>{
                        //Drawing is relative to the center of the head
                        g.rect(-t.width/2,-t.height/2+t.forwardShift/2,t.width,t.height,t.color)
                        //To draw something back at the center,
                        g.rect(-5/**Half the width of this */,-5+t.forwardShift/**Half the height - half your shift */,10,10,'gray')

                    })
                    .setProjectile(5,5,'green',3,1,5)
            )
    }
    static Sniper(x,y){
        return b(x,y,new Tower('sniper','gray'))
            .setRange(6)
            .setHead(
                new TowerHead(x,y,3,30,'lightgray',30)
                    .setShift(8)
                    .setDraw(t=>{
                        g.rect(-t.width/2,-t.height/2,t.width,t.height,t.color)
                        ctx.rotate(Math.PI)
                        g.triangle(-5,-t.forwardShift*2,10,10,'green')
                    }).setProjectile(3,3,'black',t=>{return (Entity.distanceBetween(t,t.tile.target)-t.height/2)},3,0)
            )
    }
    static Stab(x,y){
        return b(x,y,new Tower('stab','teal'))
            .setRange(0.5)
            .setHead(
                new TowerHead(x,y,10,15,'blue',30)
                    .setShift(5)
                    .setDraw(t=>{
                        g.oval(-t.width/2,-t.height/2,t.width,t.height,t.color)
                    })
                    .setProjectile(5,10,'gray',3,3,15,1,3,60,Shapes.triangle)
                )
    }
    static Machine(x,y){
        return b(x,y,new Tower('machine','#30bd6b'))
            .setRange(1.5)
            .setHead(
                new TowerHead(x,y,17,10,'#32c2b8',6)
                    .setDraw(t=>{
                        g.triangle(-t.width/2,-t.height/2,t.width,t.height,t.color)
                    })
                    .setProjectile(3,3,'#3080bd',3,0.5,40)
            )
    }
}