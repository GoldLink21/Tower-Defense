var clickEvent=new Event('clickTile')

var debug={
    showCoords:true
}

/**The exact point that was clicked on */
var lastClickedPoint=v(0,0)
/**The last tile that was clicked on */
var lastClickedTile=v(0,0)
/**
 * If just x and y are passed in, then returns board[y][x] which is (x,y)
 * If type is passed in, sets board[y][x] (x,y) to the type passed in
 */
function b(x,y,type){
    if(x>=board[0].length||x<0||y>=board.length||y<0)
        return
    //This is used as a setter if type is passed in
    if(type){
        board[y][x].onRemove()
        if(typeof type ==='function')
            type=type()
        //Assigns the properies of the type to a new object so they don't all reference the same object
        return board[y][x]=type;
        
    }else
        return board[y][x];
}

var board=[
    [new Tile('a','red'),new Tile('d','yellow').withImg('end.png'),new Tile('e','purple')],
    [new Tile('b','blue'),new Tile('c','green'),new Tile('f','orange')],
    [new Tile('g','pink'),new Tile('h','white'),new Tile('i','indigo')]
]

/**@type {CanvasRenderingContext2D} */
var ctx;

function chance(n,d){return(d)?Math.floor(Math.random()*d)<n:chance(1,n)}

var HTML={}

function boardInit(){
    /**Helper for making a new div and appending it to parent */
    function addElement(id,parent){
        var ele=document.createElement('div');
        ele.id=id;
        if(parent)
            parent.appendChild(ele);
        HTML[id]=ele;
        return ele
    }

    addElement('board',document.body)
    addElement('midbar',HTML.board)
    
    addElement('allInfo',HTML.midbar)

    addElement('info',HTML.allInfo)
    addElement('time',HTML.allInfo)
    addElement('help',HTML.allInfo);


    var canvas=document.createElement('canvas')
    canvas.id='canvas'
    document.body.appendChild(canvas)
    HTML.canvas=canvas
    ctx=canvas.getContext('2d')

    ctx.webkitImageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;

    ctx.imageSmoothingQuality='high'
    //Adds an event for if you have click teleporting active
    canvas.addEventListener('click',(event)=>{
        let rect=canvas.getBoundingClientRect()
        let rp=roundPoint((event.x-rect.left)/scale,(event.y-rect.top)/scale)

        lastClickedTile=rp
        lastClickedPoint=v((event.x-rect.left)/scale,(event.y-rect.top)/scale)
        document.dispatchEvent(clickEvent)

        onClickFunc()
    })
}

boardInit()

function isCollide(a,b){return!(((a.y+a.height)<(b.y))||
    (a.y>(b.y+b.height))||((a.x+a.width)<b.x)||(a.x>(b.x+b.width)));}

/**
 * @returns an array of the rounded points of each corner of the object 
 * @requires obj to have width and height property
 */
function getRounded(obj){
    var x=obj.x,y=obj.y,width=obj.width,height=obj.height;
    return uniqArr([roundPoint(x,y),roundPoint(x+width,y),roundPoint(x+width,y+height),roundPoint(x,y+height)])
}

/**@returns the tile coord of the point */
function roundPoint(x,y){return v(Math.floor(x/Tn.SIZE),Math.floor(y/Tn.SIZE));}
/**@returns the exact coord of the map point from the center of the tile */
function unroundPoint(x,y,obj){
    return v(x*Tn.SIZE+Tn.SIZE/2-((obj)?obj.width/2:0),y*Tn.SIZE+Tn.SIZE/2-((obj)?obj.height/2:0))
}

function getAllTileOfType(...types){
    var ret=[]
    board.forEach(x=>{
        x.forEach(y=>{
            if(y.is(...types))
                ret.push(y)
        })
    })
    return ret
}
function getAllPointsOfTilesType(...types){
    var ret=[]
    var dx=0
    var dy=0
    board.forEach(x=>{
        dx=0
        x.forEach(y=>{
            if(y.is(...types))
                ret.push(v(dx,dy))

            dx++
        })
        dy++
    })
    return ret
}


var move=false
function setMovement(bool){
    if(bool){
        if(!move){
            move=setInterval(()=>{
                ///////////////////////All moving funcs go here
            },60)
        }
    }else{
        clearInterval(move)
        move=false
    }
}

function dirToDeg(dir){
    switch(dir){
        case Dir.Right:return 90;
        case Dir.Left:return -90;
        case Dir.Down:return 180;
        case Dir.Up:return 0;
    }
}

function flipDir(dir){
    switch(dir){
        case Dir.Right:return Dir.Left
        case Dir.Left:return Dir.Right
        case Dir.Up:return Dir.Down
        case Dir.Down:return Dir.Up
    }
}

function intRange(start,end){    
    return Math.floor(Math.random()*(Math.abs(end-start)))+Math.min(start,end)
}

const clickTypes={
    makeTower:'makeTower',
    selectTile:'select',

}

function onClickFunc(){
    /*
    lastClickedPoint
    lastClickedTile
    */
    if(!b(lastClickedTile.x,lastClickedTile.y).is(Tn.path,Tn.start,Tn.end,Tn.tower))
        Towers.Sniper(lastClickedTile.x,lastClickedTile.y)

}

document.addEventListener('keyup',event=>{
    if(['e','E'].includes(event.key)){
        Enemy.Basic()
    }
    if(['I','i'].includes(event.key))
        new Enemy(Infinity).withSpeed(0.5).withColor('gold')
})