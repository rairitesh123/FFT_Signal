var a, f, N,a1,f1,N1, step;
let userInput=[];
let const_user_input = []; //points
let im = Array(6).fill(0.0);

let testData=[]
let datacoordinates1=[];
let chart2 = document.getElementById('myChart2');
let chart_ctx = chart2.getContext('2d');
let original_points = [];

function inverseChartFft(testData_temp,new_ds){
      for(i=0;i<testData.length;i++){
        datacoordinates1.push({x:i,y:testData_temp[i]});
      }
      for(i=0;i<new_ds.length;i++){
        original_points.push({x:i*60, y:new_ds[i]})
      }
    new_ds[0] = 0
    for(let i = 1; i < new_ds.length; i++){
    var temp = testData_temp.slice(i*60 -30, i*60 +30)
    var closest = temp.reduce(function(prev, curr) {
    return (Math.abs(curr - new_ds[i]) < Math.abs(prev - new_ds[i]) ? curr : prev);
    });
    var index = testData_temp.indexOf(closest)
    //console.log(index)
    new_ds[i] = index
    }
        
    var x = new Chart(chart2,
        {    
        type   : 'scatter',
        data   : {
        labels  : [ 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h' ],
        datasets: [
            {

                borderColor:customColor,
                backgroundColor:customColor,
                fill:false,
                showLine:true,
                data:datacoordinates1

            }
            ]
        },
        options: {
            legend  : {
              display: false
            },
            elements: {
              point: {
                radius : customRadius,
                display: true
              }
            }
        }
     });
    
     function customRadius( context )
     {
       let index = context.dataIndex;
       let value = context.dataset.data[ index ];
       return index === new_ds[0] || index === new_ds[1] || index === new_ds[2] || index === new_ds[3] ||
       index === new_ds[4] || index === new_ds[5]?
              10:
               0;
     }
     function customColor( context )
     {
       let index = context.dataIndex;
       let value = context.dataset.data[ index ];
       return index === new_ds[0] || index === new_ds[1] || index === new_ds[2] || index === new_ds[3] ||
       index === new_ds[4] || index === new_ds[5]?
              "red":
               "blue";
     }
    }


function transform(real, imag) {
	var n = real.length;
	if (n != imag.length)
		throw "Mismatched lengths";
	if (n == 0)
		return;
	else if ((n & (n - 1)) == 0)  // Is power of 2
		transformRadix2(real, imag);
	else  // More complicated algorithm for arbitrary sizes
		transformBluestein(real, imag);
}

// export { transform };
/* 
 * Computes the inverse discrete Fourier transform (IDFT) of the given complex vector, storing the result back into the vector.
 * The vector can have any length. This is a wrapper function. This transform does not perform scaling, so the inverse is not a true inverse.
 */
function inverseTransform(real, imag) {
	transform(imag, real);
}


/* 
 * Computes the discrete Fourier transform (DFT) of the given complex vector, storing the result back into the vector.
 * The vector's length must be a power of 2. Uses the Cooley-Tukey decimation-in-time radix-2 algorithm.
 */
function transformRadix2(real, imag) {
	// Length variables
	var n = real.length;
	if (n != imag.length)
		throw "Mismatched lengths";
	if (n == 1)  // Trivial transform
		return;
	var levels = -1;
	for (var i = 0; i < 32; i++) {
		if (1 << i == n)
			levels = i;  // Equal to log2(n)
	}
	if (levels == -1)
		throw "Length is not a power of 2";
	
	// Trigonometric tables
	var cosTable = new Array(n / 2);
	var sinTable = new Array(n / 2);
	for (var i = 0; i < n / 2; i++) {
		cosTable[i] = Math.cos(2 * Math.PI * i / n);
		sinTable[i] = Math.sin(2 * Math.PI * i / n);
	}
	
	// Bit-reversed addressing permutation
	for (var i = 0; i < n; i++) {
		var j = reverseBits(i, levels);
		if (j > i) {
			var temp = real[i];
			real[i] = real[j];
			real[j] = temp;
			temp = imag[i];
			imag[i] = imag[j];
			imag[j] = temp;
		}
	}
	
	// Cooley-Tukey decimation-in-time radix-2 FFT
	for (var size = 2; size <= n; size *= 2) {
		var halfsize = size / 2;
		var tablestep = n / size;
		for (var i = 0; i < n; i += size) {
			for (var j = i, k = 0; j < i + halfsize; j++, k += tablestep) {
				var l = j + halfsize;
				var tpre =  real[l] * cosTable[k] + imag[l] * sinTable[k];
				var tpim = -real[l] * sinTable[k] + imag[l] * cosTable[k];
				real[l] = real[j] - tpre;
				imag[l] = imag[j] - tpim;
				real[j] += tpre;
				imag[j] += tpim;
			}
		}
	}
	
	// Returns the integer whose value is the reverse of the lowest 'width' bits of the integer 'val'.
	function reverseBits(val, width) {
		var result = 0;
		for (var i = 0; i < width; i++) {
			result = (result << 1) | (val & 1);
			val >>>= 1;
		}
		return result;
	}
}


/* 
 * Computes the discrete Fourier transform (DFT) of the given complex vector, storing the result back into the vector.
 * The vector can have any length. This requires the convolution function, which in turn requires the radix-2 FFT function.
 * Uses Bluestein's chirp z-transform algorithm.
 */
function transformBluestein(real, imag) {
	// Find a power-of-2 convolution length m such that m >= n * 2 + 1
	var n = real.length;
	if (n != imag.length)
		throw "Mismatched lengths";
	var m = 1;
	while (m < n * 2 + 1)
		m *= 2;
	
	// Trigonometric tables
	var cosTable = new Array(n);
	var sinTable = new Array(n);
	for (var i = 0; i < n; i++) {
		var j = i * i % (n * 2);  // This is more accurate than j = i * i
		cosTable[i] = Math.cos(Math.PI * j / n);
		sinTable[i] = Math.sin(Math.PI * j / n);
	}
	
	// Temporary vectors and preprocessing
	var areal = newArrayOfZeros(m);
	var aimag = newArrayOfZeros(m);
	for (var i = 0; i < n; i++) {
		areal[i] =  real[i] * cosTable[i] + imag[i] * sinTable[i];
		aimag[i] = -real[i] * sinTable[i] + imag[i] * cosTable[i];
	}
	var breal = newArrayOfZeros(m);
	var bimag = newArrayOfZeros(m);
	breal[0] = cosTable[0];
	bimag[0] = sinTable[0];
	for (var i = 1; i < n; i++) {
		breal[i] = breal[m - i] = cosTable[i];
		bimag[i] = bimag[m - i] = sinTable[i];
	}
	
	// Convolution
	var creal = new Array(m);
	var cimag = new Array(m);
	convolveComplex(areal, aimag, breal, bimag, creal, cimag);
	
	// Postprocessing
	for (var i = 0; i < n; i++) {
		real[i] =  creal[i] * cosTable[i] + cimag[i] * sinTable[i];
		imag[i] = -creal[i] * sinTable[i] + cimag[i] * cosTable[i];
	}
}


/* 
 * Computes the circular convolution of the given real vectors. Each vector's length must be the same.
 */
function convolveReal(xvec, yvec, outvec) {
	var n = xvec.length;
	if (n != yvec.length || n != outvec.length)
		throw "Mismatched lengths";
	convolveComplex(xvec, newArrayOfZeros(n), yvec, newArrayOfZeros(n), outvec, newArrayOfZeros(n));
}


/* 
 * Computes the circular convolution of the given complex vectors. Each vector's length must be the same.
 */
function convolveComplex(xreal, ximag, yreal, yimag, outreal, outimag) {
	var n = xreal.length;
	if (n != ximag.length || n != yreal.length || n != yimag.length
			|| n != outreal.length || n != outimag.length)
		throw "Mismatched lengths";
	
	xreal = xreal.slice();
	ximag = ximag.slice();
	yreal = yreal.slice();
	yimag = yimag.slice();
	transform(xreal, ximag);
	transform(yreal, yimag);
	
	for (var i = 0; i < n; i++) {
		var temp = xreal[i] * yreal[i] - ximag[i] * yimag[i];
		ximag[i] = ximag[i] * yreal[i] + xreal[i] * yimag[i];
		xreal[i] = temp;
	}
	inverseTransform(xreal, ximag);
	
	for (var i = 0; i < n; i++) {  // Scaling (because this FFT implementation omits it)
		outreal[i] = xreal[i] / n;
		outimag[i] = ximag[i] / n;
	}
}


function newArrayOfZeros(n) {
	var result = [];
	for (var i = 0; i < n; i++)
		result.push(0);
	return result;
}
const mid = chart2.height >> 1;
const high = (mid - mid / 2) >> 0;
const low = (mid + mid / 2) >> 0;




function calcPoint(a0, an, a6, bn, px, height) {
    let ans = a0;
    ans = an.reduce((acc, v, i) => acc + (v * Math.cos(2*Math.PI*(i+1)*px/360)), ans);
    ans = bn.reduce((acc, v, i) => acc + (v * Math.sin(2*Math.PI*(i+1)*px/360)), ans);
    ans +=  a6*Math.cos(2*Math.PI*6*px/360); 
    return ans;
}

function drawFourier(re) { //points
    const re1=re.map((x) => x);
   
    let im = Array(re.length).fill(0.0);
    const m = re.length;
    const n = Math.floor((m+1)/2);
    transform(re, im);
    re = re.map( v => v / 6.0);
    im = im.map( v => v / 6.0);

    const a0 = re[0];
    const an = re.slice(1, n).map(v => 2 * v);
    const a6 = re[n];
    const bn = im.slice(1, n).map(v => v * -2);

    
	
    
    for (let i = 0; i < 360; i++) {
        const point = calcPoint(a0, an, a6, bn, i, chart2.getAttribute('data-height'));
        testData.push(point);
	}
	inverseChartFft(testData,re1);
}

var ctxlol = document.getElementById('myChart').getContext('2d');
let User_chart1=document.getElementById('myChart1');
function user_chart(user_var){
    console.log(user_var)
    var myChart = new Chart(User_chart1, {
        type: 'line',
        data: {
            labels: ['0','60','120','180','240','300','360'],
            datasets: [{
                label: 'User Input',
                backgroundColor: "red",
                borderColor:"red",
                data: user_var,
                fill: false,
                showLine:false,
                pointRadius:4,
                pointHoverRadius:8
            }]
        },
        options : {
            scales: {
              yAxes: [{
                scaleLabel: {
                  display: true                }
              }],
              xAxes: [{
                scaleLabel: {
                  display: true
                }
              }],
            },
            responsive:true
          }
    });
    
    
    
    
}

function checkingchart(re,im){

let x_coordinate=re;
let y_coordinate=im;
let x_array=[];
let y_array=[];

let datacoordinates=[];


   x_array=x_coordinate.toString().split(",");
   y_array=y_coordinate.toString().split(",");
 
  for(i=0;i<x_coordinate.length;i++){
	datacoordinates.push({x:x_array[i],y:y_array[i]});
  }
	 
   
	


var myChart = new Chart(ctxlol, {
	type: 'line',
	data: {
		labels: ['100','200','300','400','500','600','800'],
		datasets: [{
			label: 'Real Value',
			backgroundColor: "red",
			borderColor:"red",
			data: x_array,
            fill: false,
            showLine:false,
            pointRadius:8,
            pointHoverRadius:10
		}, {
			label: 'Imaginary Value',
			fill: false,
			backgroundColor:"blue",
			borderColor: "blue",
            data: y_array,
           showLine:false,
           pointRadius:8,
            pointHoverRadius:10
		}]
	},
	options : {
		scales: {
		  yAxes: [{
			scaleLabel: {
			  display: true,
			  labelString: 'Complex(Linear)'
			}
		  }],
		  xAxes: [{
			scaleLabel: {
			  display: true,
			  labelString: 'FFT Magnitude'
			}
		  }],
		},
		responsive:true
	  }
});



}



function writeSineCode() {
    console.log('writing Sine code');
    var row, sno, line;
    start.disabled = false;

    for (let i = 3; i < 14; i++) {
        row = code_table.rows[i];
        sno = row.cells[0];
        line = row.cells[1];
        sno.innerHTML = '' + (i + 1);
        switch (i) {
            case 3:
                line.innerHTML = '<samp><span style="color: green">FFT Signal</span></samp>';
                break;
            case 4:
                line.innerHTML = '<samp>c1 = input(\'Enter First value: \');</samp>';
                break;
            case 5:
                line.innerHTML = '<samp>c2= input(\'Enter Second value: \');</samp>';
                break;
            case 6:
                line.innerHTML = '<samp>c3= input(\'Enter Third value \'); </samp>';
                break;
            
            case 7:
                line.innerHTML = '<samp>c4= input(\'Enter Fourth value \'); </samp>';
                break;
            
            case 8:
                line.innerHTML = '<samp>c5= input(\'Enter Fifth value: \'); </samp>';
                break;
            
            case 9:
                line.innerHTML = '<samp>c6= input(\'Enter Sixth value: \'); </samp>';
                break;
            
            case 10: 
                line.innerHTML = '<samp>m = length(y);n = floor((m+1)/2);</samp>';
                break;
            case 11:
                line.innerHTML = '<samp>z = fft(y)/m;</samp>';
                break;
            case 12:
                line.innerHTML = '<samp>bn = -2*imag(z(2:n));</samp>';
                break;
            case 13:
                line.innerHTML = '<samp>an = 2*real(z(2:n)); </samp>';
                break;
            case 14:
                line.innerHTML = '<samp>title(\'Sine Signal\'); </samp>';
                break;
            case 15:
                line.innerHTML = '<samp>xlabel(\'Time (sec)\'); </samp>';
                break;
            case 16:
                line.innerHTML = '<samp>ylabel(\'Amplitude\'); </samp>';
                break;

        }
    }
}

function sineCodeTraverse() {
    console.log('code row no', code_row_no);
    if (code_row_no <= 3) {
        traverseInitalCode();
    }
    
    if (code_row_no > 13) {
        code_table.rows[--code_row_no].className = "";
        code_table.rows[--code_row_no].className = "";
        code_table.rows[--code_row_no].className = "";
        code_table.rows[--code_row_no].className = "";
        start.disabled = true;
        reset.disabled = false;
    }
    else {
        code_table.rows[code_row_no - 1].className = "";
        code_table.rows[code_row_no].className += "table-warning";
        switch (code_row_no) {
            case 4:
                user_variable = 'c1';
                user_img = 'arr';
                displayCommand('>> Enter First Element: ');
                enableInput(-1000, 1000, 1, 0);
                writeGenExplanation('input');
                // workspace updated on OK pressing.
                break;
            case 5:
                user_variable = 'c2';
                user_img = 'arr';
                displayCommand('>> Enter Second Element: ');
                enableInput(-1000, 1000, 1, 0);
                writeGenExplanation('input');
                // workspace updated on OK pressing.
                break;
            case 6:
                user_variable = 'c3';
                user_img = 'arr';
                displayCommand('>> Enter Third Element: ');
                enableInput(-1000, 1000, 1, 0);
                writeGenExplanation('input');
                // workspace updated on OK pressing.
                break;
            case 7:
                user_variable = 'c4';
                user_img = 'arr';
                displayCommand('>> Enter Fourth Element: ');
                enableInput(-1000, 1000, 1, 0);
                writeGenExplanation('input');
                // workspace updated on OK pressing.
                break;
            case 8:
                user_variable = 'c5';
                user_img = 'arr';
                displayCommand('>> Enter fifth Element: ');
                enableInput(-1000, 1000, 1, 0);
                writeGenExplanation('input');
                // workspace updated on OK pressing.
                break;
            case 9:
                user_variable = 'c6';
                user_img = 'arr';
                displayCommand('>> Enter sixth Element: ');
                enableInput(-1000, 1000, 1, 0);
                writeGenExplanation('input');
                // workspace updated on OK pressing.
                break;
            case 10:
               
                // updateWorkspace('step', '' + step, 'arr');
                writeGenExplanation('length_sample');
                user_chart(userInput);
                break;
            case 11:
                // if (f === 0) {
                //     updateWorkspace('t', '1xNaN', 'arr');
                // }
                // else {
                //     var dim = N * 100 + 1;
                //     updateWorkspace('t', '1x' + dim + ' double', 'arr');
                // }
                writeGenExplanation('fourier_sample');
                break;
            case 12:
                writeGenExplanation('ploty');
                // if (f === 0) {
                //     updateWorkspace('t', '1xNaN', 'arr');
                // }
                // else {
                //     var dim = N * 100 + 1;
                //     updateWorkspace('y', '1x' + dim + ' double', 'arr');
                // }
                break;
            case 13:
                writeGenExplanation('plotx');
                
                // code_table.rows[++code_row_no].className += "table-warning";
                // code_table.rows[++code_row_no].className += "table-warning";
                // code_table.rows[++code_row_no].className += "table-warning";
                // // plotSine();
                start.innerHTML = 'End';
                break;
            case 14:
                writeGenExplanation('input');
                
                // , 1238, 1511, 1583, 1462, 1183, 804
    


                // plotSine();
                break;
        }
        code_row_no++;
        if(document.getElementById('start').innerText === 'End'){
            const_user_input=userInput.map((x) => x);
            transform(userInput, im);
            checkingchart(userInput,im);
            
            drawFourier(const_user_input);
            }
            
    }
}


function fillSineVariables() {
    switch (user_variable) {
        case 'c1':
            a = parseFloat(user_input);
            console.log(a);
            userInput.push(a);
            break;
        case 'c2':
            f = parseFloat(user_input);
            console.log(f);
            userInput.push(f);
            break;
        case 'c3':
            N = parseFloat(user_input);
            console.log(N);
            userInput.push(N);
            break;
        case 'c4':
            a1 = parseFloat(user_input);
            console.log(N);
            userInput.push(a1);
            break;
        case 'c5':
            f1 = parseFloat(user_input);
            console.log(N);
            userInput.push(f1);
            break;
        case 'c6':
            N1 = parseFloat(user_input);
            console.log(N);
            userInput.push(N1);
            break;
    }
console.log(userInput);

}

function plotSine() {
    console.log('called plot Sine');

    var lx = [];
    var ly = [];

    if (f > 0) {
        var upper_limit = N * (1 / f);

        for (let i = 0; i <= upper_limit + (step / 2); i += step) {
            lx.push(i);
            var sine_val = a * Math.sin(2 * Math.PI * f * i);
            ly.push(sine_val);
        }
    }

    else {
        alert('Invalid Frequency!, Time period = 1/frequency, thus frequency cannot be 0.');
    }

    // plotFigure(lx, ly, 'Sine Signal', 'Time (sec)', 'Amplitude');
}




