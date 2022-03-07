var scale=1;

var images={
    preload(...imgs){
        imgs.forEach(img=>{
            var i=new Image()
            i.src='gfx/'+img
            this[img]=i
        })
    },
    get(str){
        if(this[str])
            return this[str]
        else{
            try{
                images.preload(str)
                return images.get(str)
            }catch(e){
                throw new ReferenceError(`Image of gfx/${str} not preloaded`)
            }
        } 
    }
}

images.preload()

window.onresize=function(){
    var c=/**@type {HTMLCanvasElement}*/(document.getElementById("canvas"));

    var maxWidth = (window.innerWidth)*0.9
    var maxHeight = (window.innerHeight)*0.9

    //If tall than wider or equal
    if(board.length>=board[0].length){
        if(maxWidth>=maxHeight){
            scale = maxHeight/(board.length*Tn.SIZE)
        }else{
            scale=maxWidth/(board[0].length*Tn.SIZE)
        }
    }else{
        scale=maxWidth/(board[0].length*Tn.SIZE)
        if(board.length*Tn.SIZE*scale>maxHeight){
            scale = maxHeight/(board.length*Tn.SIZE)
        }
    }

    let possibleH=Math.min(maxHeight,board.length*Tn.SIZE*scale),
        possibleW=Math.min(maxWidth,board[0].length*Tn.SIZE*scale) 

    if(c.height!==possibleH){
        c.height=possibleH
    }if(c.width!==possibleW){
        c.width=possibleW
    }
}

var drawAfter={radius:()=>{}}
Object.defineProperty(drawAfter,'add',{value:(key,func)=>{
    if(!drawAfter[key])
        drawAfter[key]=func
}})
Object.defineProperty(drawAfter,'set',{value:(key,func)=>{
    drawAfter[key]=func
}})
Object.defineProperty(drawAfter,'remove',{value:(key)=>{
    if(drawAfter[key])
        delete drawAfter[key]
}})
Object.defineProperty(drawAfter,'update',{value:(key,func)=>{
    if(drawAfter[key])
        drawAfter[key]=func
}})

drawAfter.add('focused',()=>{
    if(b(lastClickedTile.x,lastClickedTile.y).is(Tn.tower)){
        b(lastClickedTile.x,lastClickedTile.y).drawRadius()
    }
})

function drawAllAfter(){
    Object.keys(drawAfter)
        .forEach(key=>drawAfter[key]())

}

kits[0].load()

Towers.Basic(4,3)
Towers.Sniper(6,3)
Towers.Machine(4,5)
Towers.Stab(3,3)

//Enemy.Basic()
//new Enemy(Infinity).withSpeed(0).setPosition(4,2)

window.onresize()

function drawAllInGame(){

    Enemy.checkAllCollide()
    Entity.moveAll()
    if(Wave.cur)
        Wave.cur.tick()

    var c=/**@type {HTMLCanvasElement}*/(document.getElementById("canvas"));

    //Clear the board first
    ctx.clearRect(0,0,c.width,c.height)
    
    //Draw all the tiles first
    var by=0,bx=0;
    board.forEach(y=>{
        bx=0;
        y.forEach(x=>{
            //Draw tiles first
            x.draw(bx,by)
        
            //Draw coords on tiles
            if(debug.showCoords){
                ctx.fillStyle='rgba(10,10,10,0.5)'
                ctx.font=scale*10+'px Times New Roman'
                ctx.fillText("("+bx+','+by+')',(bx*Tn.SIZE+2)*scale,(by*Tn.SIZE+10)*scale)
                ctx.strokeStyle=colors.outline
            }
            bx++
        }) 
        by++
    })
    entities.forEach(ent=>{
        ent.draw(ent)
    })
  
    drawAllAfter()
}

/**Bypasses needing to multiply by scale */
var g={
    outlinedText(str,x,y,innerColor='white',lineWidth=5){
        ctx.fillStyle=innerColor
        ctx.lineWidth=lineWidth
        ctx.strokeText(str,x*scale,y*scale)
        ctx.fillText(str,x*scale,y*scale)
        ctx.lineWidth=1
    },
    rect(x,y,width,height,color){
        ctx.fillStyle=color;
        ctx.fillRect(x*scale,y*scale,width*scale,height*scale)
        g.rectOutline(x,y,width,height)
    },
    rectOutline(x,y,width,height){
        ctx.strokeStyle=colors.outline
        ctx.strokeRect(x*scale,y*scale,width*scale,height*scale)
    },
    triangle(x,y,width,height,color){
        ctx.beginPath()
        ctx.fillStyle=color
        ctx.moveTo((x+width/2)*scale,y*scale)
        ctx.lineTo(x*scale,(y+height)*scale)
        ctx.lineTo((x+width)*scale,(y+height)*scale)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
        
    },
    oval(x,y,width,height,color){
        ctx.fillStyle=color
        ctx.beginPath()
        ctx.ellipse((x+width/2)*scale,(y+height/2)*scale,(width/2)*scale,(height/2)*scale,0,0,Math.PI*2)
        ctx.fill()
        ctx.stroke()
        ctx.closePath()
    },
    ring(x,y,width,height,thickness,color){
        ctx.strokeStyle=color
        ctx.beginPath()
        ctx.ellipse((x+width/2)*scale,(y+height/2)*scale,(width/2)*scale,(height/2)*scale,0,0,Math.PI*2)
        ctx.lineWidth=thickness
        ctx.stroke()
        ctx.closePath()
        ctx.lineWidth=1
        ctx.strokeStyle='black'
    },
    img(src,x,y,w,h){
        if(typeof src==='string')
            src=images.get(src)

        ctx.drawImage(src,x*scale,y*scale,w*scale,h*scale)
    },
    imgRotated(src,deg,x,y,w,h){
        if(typeof deg==='string')
            deg=dirToDeg(deg)
        ctx.save()
        ctx.translate(x+width/2,y+height/2)
        ctx.rotate(Math.PI*deg/180)
        g.img(src,-w/2,-h/2,w,h)
        ctx.restore()
    },
    drawAtRad(centerX,centerY,func,ang){
        ctx.save()
        ctx.translate(centerX*scale,centerY*scale)
        ctx.rotate(ang)
        func()
        ctx.restore()
    },
    drawAtDeg(centerX,centerY,func,deg){
        g.drawAtRad(centerX,centerY,func,Angle.toRad(deg))
    }
}
function animate(){
    requestAnimationFrame(animate)
    drawAllInGame()    
}

var move=false
setMovement(true)
animate()