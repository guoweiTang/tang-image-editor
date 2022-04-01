/*
 * @Description: 图片编辑
 * @Author: tangguowei
 * @Date: 2022-03-31 11:39:06
 * @LastEditors: tangguowei
 * @LastEditTime: 2022-04-01 17:32:50
 */
class TangImageEditor {
    prevDom = null;
    nextDom = null;
    clearDom = null;
    // 图片画板、最终画板
    pictureDom = null;
    pictureCtx = null;
    // 编辑画板
    canvasDom = null;
    canvasCtx = null;
    options = {
      // 预设图片显示区域
      maxWidth: 800,
      maxHeight: 500,
    };
    // 画布实际展示尺寸
    width = 0;
    height = 0;
    // 历史记录
    historyData = [];
    // 当前操作步骤索引
    currentIndex = -1;
    // 作画的位置
    position = {
      x: 0,
      y: 0,
    };
    // 是否作画过程中
    isDrawing = false;
    constructor(element, options = {}) {
      if (!options.imgSrc) {
        throw new Error('图片路径不能为空');
      }
      this.options = {
        ...this.options,
        ...options,
      };
      if (typeof element === 'string') {
        this.container = document.querySelector(element);
      } else {
        this.container = element;
      }
      this.init();
    }
    // 组件初始化
    init() {
      const { imgSrc, maxWidth, maxHeight } = this.options;
      this.pictureDom = document.createElement('canvas');
      this.pictureCtx = this.pictureDom.getContext("2d");
      this.canvasDom = document.createElement('canvas');
      this.canvasCtx = this.canvasDom.getContext("2d");
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imgSrc;
      img.onload = () => {
        // 调整画板尺寸
        const scale = img.width / img.height;
        if (scale > (maxWidth / maxHeight)) {
          this.width = maxWidth;
          this.height = Number.parseInt(maxWidth / scale);
        } else {
          this.width = Number.parseInt(maxHeight * scale);
          this.height = maxHeight;
        }
        this.pictureDom.width = this.width;
        this.pictureDom.height = this.height;
        this.canvasDom.width = this.width;
        this.canvasDom.height = this.height;
        // TODO：初始图片加载不出来
        setTimeout(() => {
          this.pictureCtx.drawImage(img, 0, 0, this.width, this.height);
          this.currentIndex = -1;
          this.appendDom();
          this.bindAllEvents();
        })
      }
    }
    appendDom() {
      const content = document.createElement('div');
      content.style.position = 'relative';
      content.style.width = `${this.width}px`;
      content.style.height = `${this.height}px`;
  
      this.canvasDom.style.position = 'absolute';
      this.canvasDom.style.left = 0;
      this.canvasDom.style.top = 0;
      content.appendChild(this.pictureDom);
      content.appendChild(this.canvasDom);
      this.container.appendChild(content);
  
      const actionsDom = document.createElement('div');
      actionsDom.style.textAlign = 'center';
      actionsDom.style.marginTop = '20px';
      this.prevDom = document.createElement('button');
      this.prevDom.innerHTML = '上一步';
      this.nextDom = document.createElement('button');
      this.nextDom.innerHTML = '下一步';
      this.clearDom = document.createElement('button');
      this.clearDom.innerHTML = '重置';
      actionsDom.appendChild(this.prevDom);
      actionsDom.appendChild(this.nextDom);
      actionsDom.appendChild(this.clearDom);
      this.container.appendChild(actionsDom);
  
      this.container.style.width = `${this.width}px`;
    }
    // 绑定事件
    bindAllEvents() {
      this.canvasDom.removeEventListener('mousedown', this.handleMousedown);
      this.canvasDom.addEventListener('mousedown', this.handleMousedown.bind(this));
      this.canvasDom.removeEventListener('mousemove', this.handleMousemove);
      this.canvasDom.addEventListener('mousemove', this.handleMousemove.bind(this));
      document.body.removeEventListener('mouseup', this.handleMouseup);
      document.body.addEventListener('mouseup', this.handleMouseup.bind(this));
  
      this.prevDom.removeEventListener('click', this.handlePrev);
      this.prevDom.addEventListener('click', this.handlePrev.bind(this));
      this.nextDom.removeEventListener('click', this.handleNext);
      this.nextDom.addEventListener('click', this.handleNext.bind(this));
      this.clearDom.removeEventListener('click', this.handleClear);
      this.clearDom.addEventListener('click', this.handleClear.bind(this));
    }
    // 开始绘制
    handleMousedown(event) {
      this.position.x = event.offsetX;
      this.position.y = event.offsetY;
      this.isDrawing = true;
      this.canvasCtx.beginPath();
      this.canvasCtx.lineCap = 'round';
      this.canvasCtx.lineWidth = '2';
      this.canvasCtx.strokeStyle = 'red'; // 红色路径
      this.canvasCtx.lineTo(event.offsetX, event.offsetY);
      this.canvasCtx.stroke(); // 进行绘制
    }
    // 绘制
    handleMousemove(event) {
      if (!this.isDrawing) return;
      this.canvasCtx.moveTo(this.position.x, this.position.y);
      this.canvasCtx.lineTo(event.offsetX, event.offsetY);
      this.canvasCtx.stroke(); // 进行绘制
      this.position.x = event.offsetX;
      this.position.y = event.offsetY;
    }
    // 绘制结束
    handleMouseup() {
      if (!this.isDrawing) return;
      this.isDrawing = false;
      this.position.x = 0;
      this.position.y = 0;
      const imageData = this.canvasCtx.getImageData(0, 0, this.width, this.height);
      const newIndex = this.currentIndex + 1;
      this.historyData.splice(newIndex, this.historyData.length - newIndex, imageData);
      this.currentIndex = newIndex;
    }
    // 上一步
    handlePrev() {
      this.currentIndex -= 1;
      this.drawHistory();
    }
    // 下一步
    handleNext() {
      this.currentIndex += 1;
      this.drawHistory();
    }
    // 清除
    handleClear() {
      this.currentIndex = -1;
      this.historyData = [];
      this.canvasCtx.clearRect(0, 0, this.width, this.height);
    }
    drawHistory() {
      if (this.currentIndex > -1) {
        const imageData = this.historyData[this.currentIndex];
        this.canvasCtx.putImageData(imageData, 0, 0);
      }
    }
    // 保存图片回调
    async toDataURL() {
      return new Promise(resolve => {
        const img = new Image();
        img.src = this.canvasDom.toDataURL('image/png');
        img.onload = () => {
          // TODO：初始图片加载不出来
          setTimeout(() => {
            this.pictureCtx.drawImage(img, 0, 0, this.width, this.height);
            const dataUrl = this.pictureDom.toDataURL('image/png');
            resolve(dataUrl);
          })
        }
      })
    }
  }
  
  export default TangImageEditor;
  