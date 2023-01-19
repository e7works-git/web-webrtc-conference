let canvas;

const { Canvas, Rect, Triangle, Circle, Path } = fabric;

class FabricWrapper {
  constructor(option = { color: 'white' }) {
    this.backgroundColor = option.color;

    this.canvas = new Canvas('fabric_canvas', {
      width: this.width,
      height: this.height,
      backgroundColor: this.backgroundColor,
      selection: false,
    });
    this.canvas.isDrawingMode = false;

    this.fabric_wrap = $('.fabric_wrap');
    this.canvas_container = $('.canvas-container');
    this.canvas_wrap = $('.canvas_wrap');
    this.canvas_tool = $('.canvas_tool_wrap', this.fabric_wrap);
    this.size_wrap = $('#size_wrap', this.fabric_wrap);

    this.selectedTarget = null; // canvas selection event
    this.brushBackup = {}; // temp brush data backup
    this.brush = this.canvas.freeDrawingBrush;

    // init color
    this.color = '#000';
    this.shapeColor = '#F55';

    this.cursor = 'hide';
    this.pointerImg = $('.cursor_img');

    this.setBrushWidth();
    this.setShapeButtons();
    this.setColorPicker();
    this.setFunction();
    this.setButtons();
    this.setEventListeners();
    this.setHistory();
    this.resize();
    window.addEventListener('resize', () => {
      this.resize();
    });
  }

  sendMessage(jsonData) {
    const data = {
      message: JSON.stringify({ action: jsonData }),
      mimeType: 'whiteboard',
    };
    // console.warn('send message >>>', data, this.channel);
    try {
      this.channel.sendMessage(data);
    } catch (error) {
      console.warn('메시지를 전송하는데 실패 했습니다.', error);
    }
  }

  setColorPicker() {
    // init shape color picker
    this.shapeColorPicker = colorjoe.rgb('shapes_colorpicker', '#F55', ['alpha']); // (HTMLElement || element.id, initColor, options);
    this.shapeColorPicker.hide();
    $('.shapes_tool_wrap .color_fill').css({
      'background-image': `linear-gradient(${this.shapeColor}, ${this.shapeColor}), url(./img/fabric/transparents.svg)`,
    });
    // init brush color picker
    this.brushColorPicker = colorjoe.rgb('pen_colorpicker', '#000', ['alpha']); // (HTMLElement || element.id, initColor, options);
    this.brushColorPicker.hide();
    $('.pen_tool_wrap .color_fill').css({
      'background-image': `linear-gradient(${this.brush.color}, ${this.brush.color}), url(./img/fabric/transparents.svg)`,
    });

    // color change event
    this.shapeColorPicker.on('change', (color) => {
      const newColor = color.css().replace('rgb', 'rgba').replace(')', `,${color._alpha})`);
      $('.shapes_tool_wrap .color_fill', this.canvas_tool).css({
        'background-image': `linear-gradient(${newColor}, ${newColor}), url(./img/fabric/transparents.svg)`,
      });
      this.shapeColor = newColor;
    });
    this.brushColorPicker.on('change', (color) => {
      const newColor = color.css().replace('rgb', 'rgba').replace(')', `,${color._alpha})`);
      $('.pen_tool_wrap .color_fill', this.canvas_tool).css({
        'background-image': `linear-gradient(${newColor}, ${newColor}), url(./img/fabric/transparents.svg)`,
      });
      if (this.nowEraseMode) {
        // tmp save new color
        this.color = newColor;
      } else {
        this.brush.color = newColor; // brush color
      }
    });
  }

  setBrushWidth() {
    // default value
    this.size_wrap.hide();
    this.brush.width = 1;
    // color
    $('.pen_tool_wrap .subtool-colorpicker', this.canvas_tool)
      .off()
      .on('click', (e) => {
        if (e.target === $('.pen_tool_wrap .subtool-colorpicker', this.canvas_tool)[0] || e.target === $('.pen_tool_wrap .color_fill', this.canvas_tool)[0]) {
          const current = $('.pen_tool_wrap .subtool-colorpicker', this.canvas_tool);
          if (current.hasClass('on')) {
            current.removeClass('on');
            this.brushColorPicker.hide();
          } else {
            $(current).addClass('on');
            this.brushColorPicker.show();
          }
        }
      });
    // size buttons
    $('li.stroke', this.canvas_tool)
      .off()
      .on('click', (e) => {
        $('.canvas_tool_subwrap.pen_tool_wrap .subtool_wrap li.stroke', this.canvas_tool).removeClass('current');
      });
    $('li.stroke._1px', this.canvas_tool).on('click', (e) => {
      $('li.stroke._1px', this.canvas_tool).addClass('current');
      this.brush.width = 1;
    });
    $('li.stroke._3px', this.canvas_tool).on('click', (e) => {
      $('li.stroke._3px', this.canvas_tool).addClass('current');
      this.brush.width = 3;
    });
    $('li.stroke._5px', this.canvas_tool).on('click', (e) => {
      $('li.stroke._5px', this.canvas_tool).addClass('current');
      this.brush.width = 5;
    });
    $('li.stroke._8px', this.canvas_tool).on('click', (e) => {
      $('li.stroke._8px', this.canvas_tool).addClass('current');
      this.brush.width = 8;
    });
    $('li.stroke._12px', this.canvas_tool).on('click', (e) => {
      $('li.stroke._12px', this.canvas_tool).addClass('current');
      this.brush.width = 12;
    });
  }

  setShapeButtons() {
    $('.shapes_tool_wrap .subtool-colorpicker', this.canvas_tool)
      .off()
      .on('click', (e) => {
        if (
          e.target === $('.shapes_tool_wrap .subtool-colorpicker', this.canvas_tool)[0] ||
          e.target === $('.shapes_tool_wrap .color_fill', this.canvas_tool)[0]
        ) {
          const current = $('.shapes_tool_wrap .subtool-colorpicker', this.canvas_tool);
          if (current.hasClass('on')) {
            current.removeClass('on');
            this.shapeColorPicker.hide();
          } else {
            $(current).addClass('on');
            this.shapeColorPicker.show();
          }
        }
      });
    $('.shape-circle', this.canvas_tool)
      .off()
      .on('click', () => {
        const cir = new Circle({
          top: 100,
          left: 100,
          radius: 50,
          fill: this.shapeColor,
        });
        this.canvas.add(cir);
      });
    $('.shape-rect', this.canvas_tool)
      .off()
      .on('click', () => {
        const rect = new Rect({
          top: 100,
          left: 100,
          width: 100,
          height: 100,
          fill: this.shapeColor,
        });
        this.canvas.add(rect);
      });
    $('.shape-triangle', this.canvas_tool)
      .off()
      .on('click', () => {
        const tri = new Triangle({
          top: 100,
          left: 100,
          width: 100,
          height: 100,
          fill: this.shapeColor,
        });
        this.canvas.add(tri);
      });
  }

  setEraseMode() {
    if (this.nowEraseMode) {
      // restore brush data
      this.canvas.isDrawingMode = false;
      this.brush.width = this.brushBackup.width;
      this.brush.color = this.color || this.brushBackup.color;
      // turn off eraser
      $('.eraser', this.canvas_tool).removeClass('current');
      delete this.color;

      this.brushBackup = {};
    } else {
      // back up orignal brush
      this.brushBackup.width = this.brush.width;
      this.brushBackup.color = this.brush.color;

      // turn on eraser
      this.canvas.isDrawingMode = true;
      $('.pen', this.canvas_tool).removeClass('current');
      $('.eraser', this.canvas_tool).addClass('current');
      this.canvas.set({ freeDrawingCursor: this.fabricCursor.eraser });
      // set brush width & color to backgroudColor
      this.brush.width = 12;
      this.brush.color = this.backgroundColor;
    }
  }

  offAll(option = {}) {
    this.closeAllSubMenu();

    // pointer
    if (!option.dontOffPointer) {
      this.cursor = 'hide';
      $('.pointer', this.canvas_tool).removeClass('current');
      this.canvas.set({ defaultCursor: this.fabricCursor.default, hoverCursor: this.fabricCursor.default });
      this.sendMessage({
        event: `pointer_hide`,
        clientKey: this.channel.clientKey,
      });
    }

    // pen
    $('.pen', this.canvas_tool).removeClass('current');
    this.canvas.set({ freeDrawingCursor: this.fabricCursor.default });
    this.canvas.isDrawingMode = false;

    // eraser
    $('.eraser', this.canvas_tool).removeClass('current');
    if (this.nowEraseMode) {
      this.brush.width = this.brushBackup.width;
      this.brush.color = this.color || this.brushBackup.color;
      delete this.color;
    }
  }
  closeAllSubMenu() {
    // shapes
    $('.shapes', this.canvas_tool).removeClass('current');
    $('.shapes_tool_wrap', this.canvas_tool).css('visibility', 'hidden');
    $('.shapes_tool_wrap .subtool-colorpicker', this.canvas_tool).removeClass('on');
    this.shapeColorPicker.hide();

    // pen
    $('.pen_tool_wrap', this.canvas_tool).css('visibility', 'hidden');
    $('.pen_tool_wrap .subtool-colorpicker', this.canvas_tool).removeClass('on');
    this.brushColorPicker.hide();
  }

  setFunction() {
    this.object = {
      added: (options) => {
        if (options.target) {
          const object = options.target;
          // setting options & export json & send json
          if (object.type === 'path') object.set(this.pathObject);
          if (object.id) return; // if object has id => created by event
          const json = object.set({ id: this.uuid() }).toJSON(this.toJSONOption);
          this.sendMessage({
            event: 'object_added',
            clientKey: this.channel.clientKey,
            obj: json,
          });
        }
        // console.log('object:added', options);
      },
      selected: (options) => {
        // console.log('object:selected', options);
      },
      modified: (options) => {
        // console.log('object:modified', options);
        // objects export json
        const obj = options.target.toJSON(this.toJSONOption);
        // console.log(obj);
        // send objects
        this.sendMessage({
          event: 'object_modified',
          clientKey: this.channel.clienteKey,
          obj,
        });
      },
      moving: (options) => {
        // console.log('object:moving', options);
      },
      scaling: (options) => {
        // console.log('object:scaling', options);
      },
      rotating: (options) => {
        // console.log('object:rotating', options);
      },
      removed: (options) => {
        // this.deleteHandler에서 처리
        // console.log('object:removed', options);
        // if (this.presenter && !this.working)
        //   this.sendMessage({
        //     event: 'object_removed',
        //     clientKey: this.channel.clienteKey,
        //     obj: options.target,
        //     id: options.target.id
        //   })
      },
      created: (options) => {},
    };
    this.selection = {
      created: (options) => {
        // console.log('selection:created', options);
        this.selectedTarget = options.selected;
      },
      cleared: (options) => {
        // console.log('selection:cleared', options);
        this.selectedTarget = null;
      },
    };
    $('.subtool_wrap', this.canvas_tool)
      .off()
      .on('mousemove', () => {
        this.waitMenuOff = true;
      });
    this.mouse = {
      move: (e) => {
        if (this.waitMenuOff) {
          this.waitMenuOff = false;
          this.closeAllSubMenu();
        }
      },
      down: (option) => {
        // console.log('down!!! nowDrawing:', this.nowDrawingMode, 'nowShapes:', this.nowShapesMode);
        if (this.nowDrawingMode || this.nowShapesMode) {
          this.closeAllSubMenu();
        }
      },
    };

    // select object & press delete btn
    this.deleteHandler = (e) => {
      if (e.key === 'Delete')
        if (this.selectedTarget) {
          e.preventDefault();
          const ids = [];
          this.selectedTarget.map((object) => {
            ids.push(object.id);
          });
          this.canvas.remove(...this.selectedTarget);
          this.selectedTarget = null;

          this.sendMessage({
            event: 'object_removed',
            clientKey: this.channel.clientKey,
            ids,
          });
        }
    };

    // delete keydown
    $(window).on('keydown', this.deleteHandler);
    const scrollPos = {
      scrollTop: 0,
      scrollLeft: 0,
    };
    // share pointer mode
    $(window).on('mousemove', (e) => {
      if (this.cursor === 'show') {
        const position = {
          left: `${((e.pageX + scrollPos.scrollLeft) / window.innerWidth) * 100}vw`,
          top: `${((e.pageY + scrollPos.scrollTop) / window.innerHeight) * 100}vh`,
        };
        this.sendMessage({
          event: 'pointer_move',
          clientKey: this.channel.clientKey,
          position,
        });
      }
    });
  }

  // add tool buttons evnet handler
  setButtons() {
    this.buttons = {
      canvasBtn: (flag) => {
        if (this.channel) {
          switch (typeof flag) {
            // get data from vchat server - 'open' | 'close'
            case 'string':
              if (flag === 'open') {
                this.fabric_wrap.show();
                if (this.nowFileShare) $('.pop_present_subwrap.file_share').trigger('click');
                $('.pop_present_subwrap.white_board').attr('class', 'pop_present_subwrap white_board on');
              } else if (flag === 'close') {
                this.fabric_wrap.hide();
                $('.pop_present_subwrap.white_board').attr('class', 'pop_present_subwrap white_board off');
              }
              break;
            // i click btn
            case 'object':
              if (this.nowWhiteBoard) {
                this.fabric_wrap.hide();
                $('.pop_present_subwrap.white_board').attr('class', 'pop_present_subwrap white_board off');
                $('#wrap div.popup_bg.pop_present_wrap').removeClass('active');
                this.sendMessage('close');
              } else {
                if (this.nowPresent) $('.pop_present_subwrap.screen_share.on').trigger('click');
                this.fabric_wrap.show();
                if (this.nowFileShare) $('.pop_present_subwrap.file_share.on').trigger('click');
                $('.pop_present_subwrap.white_board').attr('class', 'pop_present_subwrap white_board on');
                $('#wrap div.popup_bg.pop_present_wrap').removeClass('active');
                this.sendMessage('open');
              }
              break;
            default:
              console.warn('unknown canvas btn event');
              break;
          }
        }
      },
      pointerBtn: () => {
        const temp = this.cursor;
        this.offAll({ dontOffPointer: true });
        this.cursor = temp;
        this.cursor = this.cursor === 'show' ? 'hide' : 'show';
        if (this.cursor === 'show') {
          $('.pointer', this.canvas_tool).addClass('current');
          this.canvas.set({ defaultCursor: this.fabricCursor.pointer, hoverCursor: this.fabricCursor.pointer });
        } else {
          $('.pointer', this.canvas_tool).removeClass('current');
          this.canvas.set({ defaultCursor: this.fabricCursor.default, hoverCursor: this.fabricCursor.default });
        }
        this.sendMessage({
          event: `pointer_${this.cursor}`,
          clientKey: this.channel.clientKey,
        });
      },
      shapesBtn: () => {
        const shapeSubWrap = $('.shapes_tool_wrap', this.canvas_tool);
        if ($('.shapes', this.canvas_tool).hasClass('current')) {
          this.offAll();
        } else {
          this.offAll();
          shapeSubWrap.css('visibility', 'visible');
          $('.shapes', this.canvas_tool).addClass('current');
        }
      },
      penBtn: () => {
        if (this.nowEraseMode) {
          this.setEraseMode(); // turn off eraser mode
        }
        if (this.nowDrawingMode) {
          // turn off pen mode
          this.offAll();
        } else {
          // turn on pen mode
          this.offAll();
          this.canvas.set({ freeDrawingCursor: this.fabricCursor.pen });
          this.canvas.isDrawingMode = true;
          $('.pen', this.canvas_tool).addClass('current');
          $('.pen_tool_wrap', this.canvas_tool).css('visibility', 'visible');
        }
      },
      penEvent: () => {
        if (this.nowDrawingMode) {
          $('.pen_tool_wrap', this.canvas_tool).css('visibility', 'visible');
        }
      },
      eraserBtn: () => {
        this.offAll();
        this.setEraseMode();
      },
      eraseAllBtn: () => {
        this.offAll();
        this.canvas.remove(...this.canvas._objects);
        this.canvas.clearHistory();
        this.sendMessage({
          event: `object_eraseAll`,
          clientKey: this.channel.clientKey,
        });
      },
    };

    // canvas버튼 클릭 시 실행
    $('.pop_present_subwrap.white_board').off('click').on('click', this.buttons.canvasBtn);

    // 커서 보이기(레이저 포인터) 버튼
    $('.pointer', this.canvas_tool).off('click').on('click', this.buttons.pointerBtn);

    // 도형 메뉴 켜기 버튼
    $('.shapes', this.canvas_tool).off('click').on('click', this.buttons.shapesBtn);

    // 펜 버튼
    $('.pen', this.canvas_tool).off('click').on('click', this.buttons.penBtn);

    $('.canvas_tool_btn.pen', this.canvas_tool).off('mouseenter').on('mouseenter', this.buttons.penEvent);

    // 지우개 버튼
    $('.eraser', this.canvas_tool).off('click').on('click', this.buttons.eraserBtn);

    // 모두 지우기 버튼
    $('.eraser-all', this.canvas_tool).off('click').on('click', this.buttons.eraseAllBtn);

    // 닫기 버튼
    $('.tool_close', this.canvas_tool).off('click').on('click', this.buttons.canvasBtn);
  }

  // add canvas event handler
  setEventListeners() {
    this.canvas.on('object:added', this.object.added);
    this.canvas.on('object:modified', this.object.modified);
    // this.canvas.on('object:removed', this.object.removed); // this.deleteHandler에서 처리
    // this.canvas.on('object:moving', this.object.moving); // modified에 통합
    // this.canvas.on('object:scaling', this.object.scaling); // modified에 통합
    // this.canvas.on('object:rotating', this.object.rotating); // modified에 통합

    this.canvas.on('selection:created', this.selection.created);
    this.canvas.on('selection:cleared', this.selection.cleared);

    this.canvas.on('mouse:down', this.mouse.down);
    // this.canvas.on('mouse:up', this.mouse.up);
    this.canvas.on('mouse:move', this.mouse.move);

    // https://github.com/alimozdemir/fabric-history
    // history 라이브러리 적용으로 인한 이벤트
    // this.canvas.on('history:append', console.log);
    // this.canvas.on('history:undo', console.log);
    // this.canvas.on('history:redo', console.log);
    // this.canvas.on('history:clear', console.log);
  }

  // fabric.js histroy library addon
  setHistory() {
    const redo = () => {
      try {
        this.working = true;
        this.canvas.redo(() => {
          this.working = false;
          this.sendMessage({
            event: 'canvas_redo',
            clientKey: this.channel.clientKey,
          });
        });
      } catch (error) {
        console.warn(error);
        this.working = false;
        this.webrtc.toastPopup('더 이상 다시 할 수 없습니다.');
      }
    };
    const undo = () => {
      try {
        this.working = true;
        this.canvas.undo(() => {
          this.working = false;
          this.sendMessage({
            event: 'canvas_undo',
            clientKey: this.channel.clientKey,
          });
        });
      } catch (error) {
        console.warn(error);
        this.working = false;
        this.webrtc.toastPopup('더 이상 되돌릴 수 없습니다.');
      }
    };
    // TODO: whiteboard용 캔버스에만 작동하도록 설정해야 함...
    // 현재는 미작동
    this.fabric_wrap.on('keydown', (e) => {
      // console.log(e);
      if (this.presenter) {
        if (e.key === 'z' || e.key === 'Z')
          if (e.ctrlKey && e.shiftKey) redo();
          else if (e.ctrlKey) undo();
          else if (e.key === 'y' || e.key === 'Y') if (e.ctrlKey) redo();
      }
    });
  }

  // fabric.js evnet handler
  canvasEvent(data) {
    if (data.clientKey === this.channel.clientKey) return;
    const { event, obj, clientKey, cursor, position } = data;
    switch (event) {
      case 'fabric_open_for_user':
        if (data.user === this.channel.clientKey) this.buttons.canvasBtn('open');
        break;
      case 'object_added':
        switch (obj.type) {
          case 'rect':
            new Rect.fromObject(obj, (rect) => {
              this.canvas.add(rect);
            });
            break;
          case 'triangle':
            new Triangle.fromObject(obj, (tri) => {
              this.canvas.add(tri);
            });
            break;
          case 'circle':
            new Circle.fromObject(obj, (cir) => {
              this.canvas.add(cir);
            });
            break;
          case 'image':
            // fabric.Image.fromURL('https://upload.wikimedia.org/wikipedia/commons/d/d7/Sad-pug.jpg', function (img) {
            //   img.set({ left: 400, top: 350, angle: 30 });
            //   img.scaleToHeight(100);
            //   img.scaleToWidth(200);
            //   this.canvas.add(img);
            // });
            break;
          case 'path':
            new Path.fromObject(obj, (path) => {
              this.canvas.add(path);
            });
            break;
        }
        break;
      case 'object_modified':
        const original = this.getCanvasObject(obj.id);
        // console.log(original, obj, original.selectable, obj.selectable, original.hasControls, obj.hasControls);
        Object.assign(original, obj);
        this.canvas.fire('object:modified:byEvent', { target: original });
        this.canvas.renderAll();
        break;
      case 'object_removed':
        const ids = data.ids;
        for (const id of ids) {
          this.canvas.remove(this.getCanvasObject(id));
        }
        break;
      case 'object_eraseAll':
        this.canvas.remove(...this.canvas._objects);
        this.canvas.clearHistory();
        break;
      case 'canvas_set':
        this.data = data.canvasData;
        this.canvas.renderAll();
        break;
      case 'canvas_undo':
        console.warn('undo!');
        this.canvas.undo();
        break;
      case 'canvas_redo':
        console.warn('redo!');
        this.canvas.redo();
        break;
      // case 'canvas_pan':
      //   // console.log('canvas:pan', data);
      //   if (data.scrollTop) this.canvas_wrap.scrollTop(data.scrollTop);
      //   if (data.scrollLeft) this.canvas_wrap.scrollLeft(data.scrollLeft);
      //   break;
      case 'pointer_show':
        let pointer = $(`#f_pointer_${clientKey}`);
        if (pointer.length === 0) {
          pointer = $(this.newPointer);
          pointer.attr('id', `f_pointer_${clientKey}`);
          this.fabric_wrap.append(pointer);
        }
        pointer.show();
        // console.log('pointer show!!', clientKey, pointer);
        break;
      case 'pointer_hide':
        // console.log('pointer hide!!', clientKey);
        $(`#f_pointer_${clientKey}`).hide();
        break;
      // case 'pointer_change':
      //   this.pointerImg.css({ cursor: cursor });
      //   break;
      case 'pointer_move':
        $(`#f_pointer_${clientKey}`).css(position);
        break;
    }
  }

  resize() {
    $('.fabric_wrap .canvas-container').css({ 'max-height': $('.canvas_wrap')[0].clientHeight < 1 ? this.height : $('.canvas_wrap')[0].clientHeight + 'px' });
    this.canvas.setDimensions({
      width: this.width,
      height: this.height,
      // height: this.width * 0.5625
    });
    if (!this.heightMax) {
      this.canvas.zoomToPoint(
        {
          x: 0,
          y: 0,
        },
        this.width / 1280
      );
    }
    this.canvas.renderAll();
  }

  // make random uuid
  uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      var r = (Math.random() * 16) | 0,
        v = c == 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  replacer(key, value) {
    document.write(key + ' : ' + value + '<br>');
    if (key === 'canvas') {
      ``;
      return undefined;
    } else {
      return value;
    }
  }

  // canvas objects find by id
  getCanvasObject(id) {
    for (const object of this.canvas._objects) {
      if (object.id === id) {
        return object;
      }
    }
    return null;
  }

  show() {
    if ($('.pop_present_subwrap.white_board').hasClass('off')) $('.pop_present_subwrap.white_board').trigger('click');
  }
  hide() {
    if ($('.pop_present_subwrap.white_board').hasClass('on')) {
      $('.pop_present_subwrap.white_board').trigger('click');
      this.offAll();
    }
  }

  reJoin() {
    this.canvas.remove(...this.canvas._objects);
    this.setBrushWidth();
    this.setShapeButtons();
    // this.setColorPicker();
    this.setFunction();
    // this.setButtons();
    // this.setEventListeners();
    // this.setHistory();
    this.resize();
  }

  /**
   * 새 유저 접속 시 실행
   * @param {Object|string} event 새 유저의 접속 이벤트 or 새 유저 클라이언트 키
   */
  remoteStreamAppend(event) {
    if (this.nowDrawingMode)
      setTimeout(() => {
        this.sendMessage({
          event: 'fabric_open_for_user',
          clientKey: this.channel.clientKey,
          user: typeof event === 'string' ? event : event.clientKey,
        });
      }, 1000);
  }

  // getter/setter canvas json
  get data() {
    return this.canvas.toJSON();
  }
  set data(json) {
    this.canvas.loadFromJSON(json);
    // this.canvas._objects.map((object) => {
    //   object.set(this.pathObject);
    // });
  }

  // remote user fabric.js objects option
  get pathObject() {
    return { selectable: false, hoverCursor: this.fabricCursor.default };
  }
  get toJSONOption() {
    return ['id', 'selectable', 'hasControls'];
  }
  // check presenter
  get presenter() {
    return $('.presenter').hasClass('on');
  }
  // set cursor data
  get fabricCursor() {
    return {
      default: `default`,
      pointer: 'url(img/fabric/cursor_pointer.svg) 8 8, default',
      pen: `url('img/fabric/cursor_pen.svg') 0 32, crosshair`,
      eraser: `url('img/fabric/cursor_eraser.svg') 0 32, crosshair`,
      object: 'move',
    };
  }
  // create new pointer
  get newPointer() {
    const img = document.createElement('img');
    img.classList.add('cursor_img');
    img.src = `img/fabric/cursor_pointer.svg`;
    img.alt = '커서 이미지';
    img.draggable = false;
    return img;
  }

  // get status
  get nowShapesMode() {
    return $('.shapes').hasClass('current');
  }
  get nowDrawingMode() {
    return this.canvas.isDrawingMode === true && !this.nowEraseMode;
  }
  get nowEraseMode() {
    return Object.getOwnPropertyNames(this.brushBackup).length !== 0;
  }
  get nowPresent() {
    return present_mode;
  }
  get nowFileShare() {
    return $('.pop_present_subwrap.file_share').hasClass('on');
  }
  get nowWhiteBoard() {
    return $('.pop_present_subwrap.white_board').hasClass('on');
  }

  get width() {
    let width = window.innerWidth * 0.75;
    let height = window * 0.5625;
    let inHeight = window.innerHeight - 70;
    if (this.heightMax) {
      width = inHeight / 0.5625;
    }
    return width;
  }
  get height() {
    let width = window.innerWidth * 0.75;
    let height = width * 0.5625;
    if (this.heightMax) {
      height = window.innerHeight - 70;
    }
    // // let height = width * 0.5625
    // //  0.5625,
    // // let height = window.innerHeight - 70
    // // console.log(height, fullHeight)
    // // if (height > fullHeight) {
    // //   height = fullHeight
    // // }

    // // if (window.innerHeight - 70 > height) {
    // //   height = window.innerHeight - 70
    // // }
    return height;
  }
  get heightMax() {
    let width = window.innerWidth * 0.75;
    let height = width * 0.5625;
    let inHeight = window.innerHeight - 70;
    if (inHeight >= height) {
      return false;
    } else {
      return true;
    }
  }
  get channel() {
    return channel;
  }
  get webrtc() {
    return webrtc;
  }
}
