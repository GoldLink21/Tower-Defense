function mapKit(colTheme){
    colors=colorTheme(colTheme)
    return {
        arr:[[]],
        /**@type {function(this)[]} */
        onLoad:[],
        pathToLoad:new Path(v(0,0),(1,1)),
        finalized:false,
        theme:colTheme,
        path(...vects){
            this.pathToLoad.points=[]
            this.pathToLoad.add(...vects)
            return this;
        },
        pathStyle(style=Path.styles.horizVert){
            this.pathToLoad.setStyle(style)
            return this
        },
        get(x,y){
            if(x<0||y<0||x>=this.arr[0].length||y>=this.arr.length)
                return false
            return this.arr[y][x]
        },
        set(type=Tn.Wall,width=9,height=9){
            this.arr=[];
            for(let i=0;i<height;i++){
                this.arr[i]=[];
                for(let j=0;j<width;j++)
                    this.tile(j,i,type)
            }
            this.isSet=true
            return this
        },
        tile(x=[],y=[],type=Tn.slot){
            if(typeof type!=='string'){
                console.warn('Switching to only using strings in tile func.')
                return this
            }
            if(Array.isArray(x)){
                if(Array.isArray(y))
                    for(let i=0;i<x.length;i++)
                        //Goes through using each x and y as a pair, meaning they are all points
                        this.arr[y[i]][x[i]]=type;
                else
                    for(let i=0;i<x.length;i++)
                        //Means that y is constant so all x's are at that y 
                        this.arr[y][x[i]]=type;
            }else if(Array.isArray(y))
                for(let i=0;i<y.length;i++)
                    //Means the x is constant and so all y's go at that x
                    this.arr[y[i]][x]=type;
            else
                //Two constants passed in so it's just one point
                this.arr[y][x]=type;
            return this
        },
        border(type){
            for(let i=0;i<this.arr.length;i++)
                for(let j=0;j<this.arr[0].length;j++)
                    if(j===0||j===this.arr[0].length-1||i===0||i===this.arr.length-1)
                        this.tile(j,i,type)

            return this
        },
        /**@param {function(this)} func */
        if(condition,func,elseFunc=()=>{}){
            if(condition)
                func(this)
            else
                elseFunc(this)
            return this
        },
        /**@param {function(this)} func*/
        run(func){
            func(this)
            return this
        },
        makeArr(){
            var nArr=this.arr.map(y=>y.map(x=>tileByName(x)))
            return nArr
        },
        load(){
            entities=[]
            this.onLoad.forEach(func=>func(this))

            mapPath=Path.clone(this.pathToLoad)
            
            colors=colorTheme(this.theme)
            



            if(!this.finalized){
                this.finalized=true;
                setStringPath(this.arr)
            }
            clearBoard()
            board=this.makeArr()
            window.onresize()
        }
    }
}

/**Takes either a function or a premade tile */
function tCopy(type){
    if(typeof type==='function')
        return Object.create(type())
    else 
        return Object.create(type)
}

function setAllPath(){
    let ap=mapPath.getAllPoints()
   
    ap.forEach(p=>b(p.x,p.y,Tn.Path));
    var first=ap[0],
        last=ap[ap.length-1]
    b(first.x,first.y,Tn.Start)
    b(last.x,last.y,Tn.End)
}
function setStringPath(arr){
    var ap=mapPath.getAllPoints()
   
    ap.forEach(p=>arr[p.y][p.x]=Tn.path);
    var first=ap[0],
        last=ap[ap.length-1]
    arr[first.y][first.x]=Tn.start
    arr[last.y][last.x]=Tn.end
}

var kits={
    0:mapKit(themes.winter).set(Tn.wall).path(v(0,0),v(5,2),v(3,4),v(8,8)),
    1:mapKit().set(Tn.wall).path(v(1,1),v(5,2),v(3,4),v(8,8)),
    2:mapKit(themes.winter).set(Tn.slot,15,15).path(v(0,0),v(14,2),v(0,4),v(14,6),v(0,8),v(14,10),v(0,12),v(14,14))
}

function clearBoard(){
    for(let i=0;i<board.length;i++){
        for(let j=0;j<board[i].length;j++){
            board[i][j].onRemove()
            board[i][j]=undefined
        }
    }
    board.length=0
}