/**Enum for directions */
const Dir={
    Up:'up',Down:'down',Left:'left',Right:'right',
    get Random(){
        return rndArrEle([Dir.Up,Dir.Down,Dir.Right,Dir.Left])
    }
}

/**Short for array range. Makes an array with numbers from start-end */
function aR(start,end){
    var index=0,arr=[];
    for(let i=start;(start<end)?(i<end+1):(i>end-1);(start<end)?(i++):(i--))
        arr[index++]=i
    return arr;
}

class Tile{
    constructor(name,color,hasImage,otherProps){
        this.name=name
        Object.assign(this,otherProps)
        if(this.tileUnder){
            if(typeof this.tileUnder==='function')
                this.tileUnder=this.tileUnder()
            this.color=this.tileUnder.color
        }
        if(color!==undefined){
            if(Array.isArray(color))
                this.color=rndArrEle(color)
            else
                this.color=color
        }
        if(Array.isArray(hasImage))
            this.hasImage=rndArrEle(hasImage)
        else
            this.hasImage=hasImage
            
        this.size=35;
        this.width=this.size;
        this.height=this.size
    }
    is(...others){
        for(let i=0;i<others.length;i++){
            if(typeof others[i]==='string'&&others[i]===this.name)
                return true
            if(this.name===others[i].name)
                return true
        }
        return false
    }
    subIs(...others){
        for(let i=0;i<others.length;i++){
            if(typeof others[i]==='string'){
                if(this.subName&&others[i]===this.subName)
                    return true
            }if(this.subName&&this.subName===others[i].subName){
                return true
            }
        }
        return false
    }
    withColor(...col){
        this.color=rndArrEle(col)
        return this;
    }
    withImg(...img){
        this.hasImage=rndArrEle(img)
        return this
    }
    draw(x,y){
        g.rect(Tn.SIZE*x,Tn.SIZE*y,Tn.SIZE,Tn.SIZE,this.color)
        
        if(this.hasImage)
            g.img(this.hasImage,Tn.SIZE*x,Tn.SIZE*y,Tn.SIZE,Tn.SIZE)   
    }
    onRemove(){}
}

function subTile(tile,subName,otherProps){
    return Object.assign(tile,{subName:subName},otherProps)
}

function rndArrEle(arr){
    return arr[Math.floor(Math.random()*arr.length)]
}

function rndCol(rs=[0,255],gs=[0,255],bs=[0,255]){
    return `rgb(${(Array.isArray(rs))?rndArrEle(aR(rs[0],rs[1])):rs},`+
        `${(Array.isArray(gs))?rndArrEle(aR(gs[0],gs[1])):gs},${(Array.isArray(bs))?rndArrEle(aR(bs[0],bs[1])):bs})`
}

const themes={
    old:'dc',
    winter:'winter',

}

function colorTheme(theme){

    function set(old,winter){
        return (theme===themes.old)?
            old:
        (theme===themes.winter)?
            winter:
            old
    }

    return {
        get wall(){return set('rgb(78,78,78)','lightblue')},
        get path(){return set(rndCol([160,170],[160,170],[160,170]),'lightslategray')},
        get start(){return 'white'},
        get end(){return 'gold'},
        get slot(){return set('rgb(135,135,135)','steelblue')},
        get outline(){return set('black','darkblue')}
    }
}

var colors={
    get wall(){return 'lightblue'},//'rgb(78,78,78)'},
    get path(){return 'lightslategray'},//rndCol([160,170],[160,170],[160,170])},
    get start(){return 'white'},
    get end(){return 'gold'},
    get slot(){return 'rgb(135,135,135)'},

    /////////////////////////////////////////
    get trap(){return 'peru'},
    get hidden(){return 'rgb(65,65,65)'},
    get fakeLava(){return '#600000'},
    get grass(){return rndCol(0,[160,250],0)},
    get target(){return'rgb(191,54,12)'},
    get lava(){return 'maroon'},
}

//Fancy Tile and subTile system which simplifies code a fair bit
var Tn={
    //These are all tiles with distinct properties
    //Spots nothing can be
    Wall(color=colors.wall,hasImage)
        {return new Tile('wall',color,hasImage)},
    //Path enemies take
    Path(color=colors.path,hasImage)
        {return new Tile('path',color,hasImage)},
    //Spot allowing a tower to be placed
    Slot(color=colors.slot,hasImage)
        {return new Tile('slot',color,hasImage)},
    //Just a display for where the enemies start their pathing
    Start(color=colors.start,hasImage)
        {return new Tile('start',color,hasImage)},
    //Just a display for when the enemies end their pathing
    End(color=colors.end,hasImage='end.png')
        {return new Tile('end',color,hasImage)},
    //Default blank tower for type checking
    Tower()
        {return new Tile('tower','rgba(0,0,0,0)')}
}

var oneTileCopy={}

function tileByName(name){
    return oneTileCopy[name]()
}

//Makes lowercase properties of everything for the is function
for(var type in Tn){
    var name=Tn[type]().name

    oneTileCopy[name]=Tn[type]

    if(!Tn[name])
        Object.defineProperty(Tn,name,{value:name})
}

Object.defineProperty(Tn,'SIZE',{value:35,})

const Angle={
    toRad(deg){
        return Angle.roundRad(Math.PI*deg/180)
    },toDeg(rad){
        return Angle.roundDeg((180*rad)/Math.PI)
    },
    roundDeg(deg){
        while(deg<0)
            deg+=360;
        return deg%360
    },
    roundRad(rad){
        while(rad<0)
            rad+=(Math.PI*2)
        return rad%(Math.PI*2)
    }
}

function flat(arr=[]){
    while(arr.find(e=>Array.isArray(e)))
        arr=arr.flat()
    return arr
}
