let objs = [];
let colors = ['#f71735', '#f7d002', '#1A53C0', '#232323'];
// 標題與動畫控制
let titleText = '淡江大學';
let titleState = 'entering'; // entering -> paused -> exiting -> idle
let titleStartTime = 0;
let titleEnterDuration = 1000; // ms
let titlePauseDuration = 3000; // ms
let titleExitDuration = 800; // ms
let titleY = 0;
let titleYStart = 0;
let titleYTarget = 0;

function setup() {
	//let canvasSize = min(windowWidth, windowHeight);  //這行代碼的意思是創建一個正方形的畫布，邊長為當前窗口寬度和高度的最小值
	createCanvas(windowWidth, windowHeight); //創建一個畫布，大小為canvasSize x canvasSize
  
  
	rectMode(CENTER);
	objs.push(new DynamicShape());
}

function draw() {
	background(255);
	for (let i of objs) {
		i.run();
	}

	if (frameCount % int(random([15, 30])) == 0) {
		let addNum = int(random(1, 30));
		for (let i = 0; i < addNum; i++) {
			objs.push(new DynamicShape());
		}
	}
	for (let i = 0; i < objs.length; i++) {
		if (objs[i].isDead) {
			objs.splice(i, 1);
		}
	}

	// 在特效中央顯示標題文字（保留原特效）
	push();
	textAlign(CENTER, CENTER);
	// 文字大小為畫面高度的 1/10（也可用 min(width,height)/10）
	let titleSize = Math.min(width, height) / 10;
	textSize(titleSize);
	// 計算文字與方框尺寸
	let txtW = textWidth(titleText);
	let boxPadding = titleSize * 0.4; // 方框內邊距
	let boxW = txtW + boxPadding * 2;
	let boxH = titleSize + boxPadding * 2;
	// 固定方框中心位置（不動）
	let boxCX = width / 2;
	let boxCY = height / 2;

	// 初始化 titleYStart / titleYTarget（第一次進入時）
	if (titleStartTime === 0) {
		titleStartTime = millis();
		titleYStart = height + boxH; // 從畫面底部外側開始
		titleYTarget = boxCY; // 目標為方框中心
		titleY = titleYStart;
	}

	// 依照狀態計算 titleY
	let now = millis();
	if (titleState === 'entering') {
		let t = (now - titleStartTime) / titleEnterDuration;
		if (t >= 1) {
			t = 1;
			titleY = titleYTarget;
			titleState = 'paused';
			titleStartTime = now; // pause start
		} else {
			titleY = lerp(titleYStart, titleYTarget, easeOutBounce(t));
		}
	} else if (titleState === 'paused') {
		// 停滯一段時間後開始退出
		if (now - titleStartTime >= titlePauseDuration) {
			titleState = 'exiting';
			titleStartTime = now;
		}
		// 保持在 target
		titleY = titleYTarget;
	} else if (titleState === 'exiting') {
		let t = (now - titleStartTime) / titleExitDuration;
		if (t >= 1) {
			t = 1;
			titleY = titleYStart;
			// 不進入 idle，直接重新啟動 entering，實現循環
			titleState = 'entering';
			titleStartTime = now;
			// 重新計算起始與目標（允許在畫面大小變動時更新位置）
			titleYStart = height + boxH;
			titleYTarget = boxCY;
		} else {
			titleY = lerp(titleYTarget, titleYStart, easeInOutCirc(t));
		}
	} else {
		// idle: 保持在 start (回到原位)
		titleY = titleYStart;
	}

	// draw 固定的白色方框（不跟著文字動）
	push();
	noStroke();
	fill(255); // 白色方框
	rectMode(CENTER);
	rect(boxCX, boxCY, boxW, boxH, 6);
	pop();

	// draw 文字（只移動文字）
	fill('#ff0066');
	noStroke();
	text(titleText, boxCX, titleY);
	pop();
}

function windowResized() {
  // 當視窗尺寸改變時，調整畫布大小以保持文字與特效對應
  resizeCanvas(windowWidth, windowHeight);
}

function easeInOutExpo(x) {
	return x === 0 ? 0 :
		x === 1 ?
		1 :
		x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 :
		(2 - Math.pow(2, -20 * x + 10)) / 2;
}

// easing: easeOutBounce
function easeOutBounce(t) {
	// t in [0,1]
	const n1 = 7.5625;
	const d1 = 2.75;
	if (t < 1 / d1) {
		return n1 * t * t;
	} else if (t < 2 / d1) {
		t -= 1.5 / d1;
		return n1 * t * t + 0.75;
	} else if (t < 2.5 / d1) {
		t -= 2.25 / d1;
		return n1 * t * t + 0.9375;
	} else {
		t -= 2.625 / d1;
		return n1 * t * t + 0.984375;
	}
}

// easing: easeInOutCirc
function easeInOutCirc(t) {
	if (t < 0.5) {
		return (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2;
	} else {
		return (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2;
	}
}

class DynamicShape {
	constructor() {
		this.x = random(0.3, 0.7) * width;
		this.y = random(0.3, 0.7) * height;
		this.reductionRatio = 1;
		this.shapeType = int(random(4));
		this.animationType = 0;
		this.maxActionPoints = int(random(2, 5));
		this.actionPoints = this.maxActionPoints;
		this.elapsedT = 0;
		this.size = 0;
		this.sizeMax = width * random(0.01, 0.05);
		this.fromSize = 0;
		this.init();
		this.isDead = false;
		this.clr = random(colors);
		this.changeShape = true;
		this.ang = int(random(2)) * PI * 0.25;
		this.lineSW = 0;
	}

	show() {
		push();
		translate(this.x, this.y);
		if (this.animationType == 1) scale(1, this.reductionRatio);
		if (this.animationType == 2) scale(this.reductionRatio, 1);
		fill(this.clr);
		stroke(this.clr);
		strokeWeight(this.size * 0.05);
		if (this.shapeType == 0) {
			noStroke();
			circle(0, 0, this.size);
		} else if (this.shapeType == 1) {
			noFill();
			circle(0, 0, this.size);
		} else if (this.shapeType == 2) {
			noStroke();
			rect(0, 0, this.size, this.size);
		} else if (this.shapeType == 3) {
			noFill();
			rect(0, 0, this.size * 0.9, this.size * 0.9);
		} else if (this.shapeType == 4) {
			line(0, -this.size * 0.45, 0, this.size * 0.45);
			line(-this.size * 0.45, 0, this.size * 0.45, 0);
		}
		pop();
		strokeWeight(this.lineSW);
		stroke(this.clr);
		line(this.x, this.y, this.fromX, this.fromY);
	}

	move() {
		let n = easeInOutExpo(norm(this.elapsedT, 0, this.duration));
		if (0 < this.elapsedT && this.elapsedT < this.duration) {
			if (this.actionPoints == this.maxActionPoints) {
				this.size = lerp(0, this.sizeMax, n);
			} else if (this.actionPoints > 0) {
				if (this.animationType == 0) {
					this.size = lerp(this.fromSize, this.toSize, n);
				} else if (this.animationType == 1) {
					this.x = lerp(this.fromX, this.toX, n);
					this.lineSW = lerp(0, this.size / 5, sin(n * PI));
				} else if (this.animationType == 2) {
					this.y = lerp(this.fromY, this.toY, n);
					this.lineSW = lerp(0, this.size / 5, sin(n * PI));
				} else if (this.animationType == 3) {
					if (this.changeShape == true) {
						this.shapeType = int(random(5));
						this.changeShape = false;
					}
				}
				this.reductionRatio = lerp(1, 0.3, sin(n * PI));
			} else {
				this.size = lerp(this.fromSize, 0, n);
			}
		}

		this.elapsedT++;
		if (this.elapsedT > this.duration) {
			this.actionPoints--;
			this.init();
		}
		if (this.actionPoints < 0) {
			this.isDead = true;
		}
	}

	run() {
		this.show();
		this.move();
	}

	init() {
		this.elapsedT = 0;
		this.fromSize = this.size;
		this.toSize = this.sizeMax * random(0.5, 1.5);
		this.fromX = this.x;
		this.toX = this.fromX + (width / 10) * random([-1, 1]) * int(random(1, 4));
		this.fromY = this.y;
		this.toY = this.fromY + (height / 10) * random([-1, 1]) * int(random(1, 4));
		this.animationType = int(random(3));
		this.duration = random(20, 50);
	}
}