/** Display mode bit masks */
var GLUT_RGB = 0;
var GLUT_RGBA = GLUT_RGB;
var GLUT_INDEX = 1;
var GLUT_SINGLE = 0;
var GLUT_DOUBLE = 2;
var GLUT_ACCUM = 4;
var GLUT_ALPHA = 8;
var GLUT_DEPTH = 16;
var GLUT_STENCIL = 32;
var GLUT_MULTISAMPLE = 128;
var GLUT_STEREO = 256;
var GLUT_LUMINANCE = 512; 

var GL_POINTS=                         0x0000;
var GL_LINES=                          0x0001;
var GL_LINE_LOOP=                      0x0002;
var GL_LINE_STRIP=                     0x0003;
var GL_TRIANGLES=                      0x0004;
var GL_TRIANGLE_STRIP=                 0x0005;
var GL_TRIANGLE_FAN=                   0x0006;
var GL_QUADS=                          0x0007;
var GL_QUAD_STRIP=                     0x0008;
var GL_POLYGON=                        0x0009;

/** GLUT inter-file variables */
Mode = GLUT_RGB | GLUT_SINGLE | GLUT_DEPTH; 
function glBegin(model)
{
	pipeline_state = model;
	pipeline_index = [];
	pipeline_color =[];
	pipeline_indexCount = 0;
	pipeline_color_state =[1,0,0];
	pipeline_vertex = [];
}
function glColor3f(r,g,b)
{
	pipeline_color_state =[r,g,b];
}

function glVertex3f(x,y,z)	
{
	var inVec4 = new Vec4();
	inVec4.getFromArray([x,y,z,1]);
	var outVec4 = mat4VectProduct(matrixStacks.getActiveMatrix(),inVec4);
	//document.write(outVec4.x+" "+outVec4.y+" "+outVec4.z+" "+outVec4.w+" ");
	pipeline_vertex.unshift(outVec4.x,outVec4.y,outVec4.z, outVec4.w);
	if(pipeline_color.length==0) //so, this only works for one color per shape. TODO
		pipeline_color.unshift(pipeline_color_state[0], pipeline_color_state[1], pipeline_color_state[2], 1);
	if(pipeline_state== GL_TRIANGLES)
	{
		//pipeline_index.push(pipeline_indexCount); //What is this line for?
		pipeline_indexCount += 1;
	}
}

function glEnd()
{
	//Set up buffer and read coordinates
	var aspect = canvas.width / canvas.height;
	dimension = 4;
	
	vbuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer);					
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pipeline_vertex), gl.STATIC_DRAW);

	//Setting uniforms and attributes
	gl.useProgram(program); 

	program.uColor = gl.getUniformLocation(program, "uColor");
	gl.uniform4fv(program.uColor, pipeline_color);

	program.aVertexPosition = gl.getAttribLocation(program, "aVertexPosition");
	gl.enableVertexAttribArray(program.aVertexPosition);
	gl.vertexAttribPointer(program.aVertexPosition, dimension, gl.FLOAT, false, 0, 0);

	//Drawing
	gl.drawArrays(gl.TRIANGLES, 0, pipeline_indexCount);
}

/** OpenGL functions */
glutInitDisplayMode = function(mode) {
	__glutDisplayMode = mode; //This doesnt do anything yet.
}

glutDisplayFunc = function(callback) {
	callback();
}

function glutInitWindowSize(width, height)
{
	document.getElementById("canvas").style.width=width;
	document.getElementById("canvas").style.height=height; 
}

function glutInit()
{
	//Get the WebGL context from the canvas element
	canvas = document.getElementById("canvas");
	gl = canvas.getContext("experimental-webgl");
	
	//Defining the viewport and setting default color
	gl.viewport(0,0,canvas.width, canvas.height);
	gl.clearColor(0.9,0.9,0.9,1);
	gl.clear(gl.COLOR_BUFFER_BIT);
	
	//Compiling and linking shaders
	var v = document.getElementById("vertex").firstChild.nodeValue;
	var f = document.getElementById("fragment").firstChild.nodeValue;
	var vs = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vs, v);
	gl.compileShader(vs);
	var fs = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fs, f);
	gl.compileShader(fs);
	program = gl.createProgram();
	gl.attachShader(program, vs);
	gl.attachShader(program, fs);
	gl.linkProgram(program);

	//Debugging shaders
	if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) 
		console.log(gl.getShaderInfoLog(vs));
					
	if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) 
		console.log(gl.getShaderInfoLog(fs));
				
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) 
		console.log(gl.getProgramInfoLog(program));

	//rest of setup in glEnd
}