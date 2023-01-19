const LIST_URL = (roomId) => {
  return `${BASE_URL}/api/openapi/screenShareDocumentList?roomId=${roomId}`;
};
const UPLOAD_URL = `${BASE_URL}/api/openapi/screenShareDocument`;
const DOWNLOAD_URL = (fileKey, roomId) => {
  return `${BASE_URL}/api/openapi/screenShareDocument?fileKey=${fileKey}&roomId=${roomId}`;
};
const DELETE_URL = `${BASE_URL}/api/openapi/screenShareDocument/delete`;

class FileHelper {
  constructor(data) {
    this.owner = null;

    this.fileShare = $('.file_wrap, .file_list, .file_list_button');
    this.fileBtn = $('.pop_present_subwrap.file_share');
    this.file_wrap = $('.file_wrap');
    this.file_list_wrap = $('.file_list_wrap');
    this.file_view = $('.file_view', this.file_list_wrap);
    this.file_list = $('.file_list');

    this.canvas_tool = $('.file_wrap .canvas_tool_wrap');

    this.canvases = []; // canvases array
    this.brushBackup = {}; // temp brush data backup
    this._targetIndex = 0;
    this.shapeColor = '#F55';
    this.brushColor = '#000';
    this.brushSize = 1;

    // file
    if (data) {
      this.title = data.title;
      this.fileList = data.fileList;
    }

    this.setColorPickers();
    this.setHandler();
    this.setToolHandler();
    this.setPenHandler();
    this.setShapeHandler();
    this.dispose(true); // 초기화
  }

  sendMessage(jsonData) {
    const data = {
      message: JSON.stringify({ action: jsonData }),
      // message: { action: jsonData },
      mimeType: 'fileShare',
    };
    // console.warn('send message >>>', data);
    try {
      this.channel.sendMessage(data);
    } catch (error) {
      if (error.message !== 'INVALID_STATE_ERR') {
        throw error;
      }
    }
  }

  get brush() {
    return this.canvases[0].freeDrawingBrush;
  }
  set brush({ width, color, erase }) {
    // 모든 캔버스에 일괄 적용
    for (const canvas of this.canvases) {
      if (erase === true) {
        canvas.freeDrawingBrush = new fabric.EraserBrush(canvas);
        canvas.freeDrawingBrush.width = 16;
        canvas.isDrawingMode = true;
        canvas.set({ freeDrawingCursor: this.cursorObject.eraser });
      } else if (erase === false) {
        canvas.isDrawingMode = false;
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      }
      if (width) {
        canvas.freeDrawingBrush.width = width;
        this.brushSize = width;
      }
      if (color) {
        canvas.freeDrawingBrush.color = color;
        this.brushColor = color;
      }
    }
  }

  // html 만들기
  makeHTML() {
    for (let i = 0; i < this.fileList.length; i++) {
      this.file_view.append($(`<canvas id="canvas_${i}" class="file_canvas" data-index="${i}"></canvas>`));
      // this.file_list.append($(`<img src="${this.fileList[i].filePath}" alt="${this.title}_${i}" data-index="${i}" draggable="false"></img>`));
      this.file_list.append(
        $(
          `<div class="file_img_list"><p>${i + 1}</p><img src="${this.fileList[i].filePath}" alt="${
            this.title
          }_${i}" data-index="${i}" draggable="false"></div>`
        )
      );
    }
  }

  // 캔버스 생성 및 초기 설정
  setCanvases() {
    for (let i = 0; i < this.fileList.length; i++) {
      const canvas = new Canvas(`canvas_${i}`, {
        backgroudColor: 'rgba(0,0,0,0)',
        isDrawingMode: false,
        selection: false,
      });
      $('.canvas-container', this.file_view).css({ margin: '20px auto' });
      $(`#canvas_${i}`, this.file_view).css({ background: `url(${this.fileList[i].filePath})`, backgroundSize: '100%' });
      this.canvases.push(canvas);
    }
    this.brush = { color: this.brushColor, width: this.brushSize };
    this.resize();
  }

  // 색상 선택기 생성 및 이벤트 핸들러 등록 (colorjoe lib)
  setColorPickers() {
    // init shape color picker
    this.shapeColorPicker = colorjoe.rgb('tool_shapes_colorpicker', '#F55', ['alpha']); // (HTMLElement || element.id, initColor, options);
    this.shapeColorPicker.hide();
    $('.shapes_tool_wrap .color_fill', this.file_wrap).css({
      'background-image': `linear-gradient(${this.shapeColor}, ${this.shapeColor}), url(./img/fabric/transparents.svg)`,
    });
    // init brush color picker
    this.brushColorPicker = colorjoe.rgb('tool_pen_colorpicker', '#000', ['alpha']); // (HTMLElement || element.id, initColor, options);
    this.brushColorPicker.hide();
    $('.pen_tool_wrap .color_fill', this.file_wrap).css({
      'background-image': `linear-gradient(${'#000000' || this.brush.color}, ${'#000000' || this.brush.color}), url(./img/fabric/transparents.svg)`,
    });

    // color change event
    this.shapeColorPicker.on('change', (color) => {
      const newColor = color.css().replace('rgb', 'rgba').replace(')', `,${color._alpha})`);
      $('.shapes_tool_wrap .color_fill', this.file_wrap).css({
        'background-image': `linear-gradient(${newColor}, ${newColor}), url(./img/fabric/transparents.svg)`,
      });
      this.shapeColor = newColor;
    });
    this.brushColorPicker.on('change', (color) => {
      const newColor = color.css().replace('rgb', 'rgba').replace(')', `,${color._alpha})`);
      $('.pen_tool_wrap .color_fill', this.file_wrap).css({
        'background-image': `linear-gradient(${newColor}, ${newColor}), url(./img/fabric/transparents.svg)`,
      });
      this.brushColor = newColor;
      this.brush = { color: newColor }; // brush color
    });
  }

  // 초기화해도 유지되는 이벤트 핸들러 등록
  setHandler() {
    // 시작 후 우측에 생성되는 이미지 클릭 시 (페이지 선택)
    this.imgClickHandler = (e) => {
      const index = typeof e === 'number' ? e : $(e.target).data('index');
      $('.file_list .file_img_list').removeClass('current');
      $(`.file_list img[data-index="${index}"]`).parent().addClass('current');
      $('.canvas-container', this.file_wrap).hide();
      $(`#canvas_${index}`, this.file_wrap).parent().show();
      if (this.targetIndex !== index) {
        // console.log('clicked!!');
        this.targetIndex = index;
        if (this.owner === this.channel.clientKey)
          this.sendMessage({
            event: 'canvas_change',
            target: this.targetIndex,
            clientKey: this.channel.clientKey,
          });
      }
      this.resize();
    };
    $(document).on('click', '.file_list img', this.imgClickHandler);

    // 우측 페이지 목록 표시/숨김 처리
    const button = $('.file_list_button');
    button.on('click', () => {
      button.toggleClass('off');
      button.toggleClass('on');
    });

    // file share 킨 후 나타나는 문서 목록 선택 시
    this.documentClickhandler = async (e) => {
      const li = $(e.currentTarget);
      const target = $(e.target);
      this.fileKey = li.data('fileKey');

      // 삭제 버튼 클릭
      if (target.hasClass('remove_document')) {
        const formdata = new FormData();
        formdata.append('fileKey', this.fileKey);
        formdata.append('roomId', this.channel.roomId);
        fetch(DELETE_URL, {
          method: 'POST',
          body: formdata,
        })
          .then((res) => res.json())
          .then((json) => {
            if (json.result_cd === 1) li.remove();
            else throw new Error(json.result_msg);
          })
          .catch((err) => console.error(err));
      } else {
        const res = await fetch(DOWNLOAD_URL(this.fileKey, this.channel.roomId));
        const { title, list: fileList } = await res.json();
        this.changeFileList({ title, fileList }, true);
      }
    };
    $(document).on('click', 'ul.upload_document_list .document_list_subwrap li', this.documentClickhandler);

    window.addEventListener('resize', () => {
      this.resize();
    });
  }

  // file share의 툴 이벤트 핸들러
  setToolHandler() {
    this.buttons = {
      fileShareBtn: (flag) => {
        if (this.channel) {
          if (flag === 'close') {
            this.fileBtn.removeClass('on');
            this.fileBtn.addClass('off');
            this.fileShare.hide();
          } else if (flag === 'open') {
            this.fileBtn.addClass('on');
            this.fileBtn.removeClass('off');
            this.fileShare.show();
            if (this.nowWhiteBoard) fabricWrapper.hide(); // whiteboard
            if (this.nowPresent) $('.pop_present_subwrap.screen_share.on').trigger('click'); // present
          } else if (typeof flag === 'object') {
            $('#wrap div.popup_bg.pop_present_wrap').removeClass('active'); // 화면 공유하기 서브메뉴 숨김
            if (this.nowFileShare) {
              this.fileBtn.removeClass('on');
              this.fileBtn.addClass('off');
              this.fileShare.hide();
              if (this.fileList) this.sendMessage('close');
            } else {
              this.fileBtn.addClass('on');
              this.fileBtn.removeClass('off');
              this.fileShare.show();
              if (this.fileList) this.sendMessage('open');
              if (this.nowWhiteBoard) fabricWrapper.hide(); // whiteboard
              if (this.nowPresent) $('.pop_present_subwrap.screen_share.on').trigger('click'); // present
            }
          }
        }
      },
      pointerBtn: () => {
        if (this.channel && this.canvasExist) {
          const temp = this.cursor;
          this.offAll({ dontOffPointer: true });
          this.cursor = temp;
          this.cursor = this.cursor === 'show' ? 'hide' : 'show';
          if (this.cursor === 'show') {
            $('.pointer', this.canvas_tool).addClass('current');
            for (const canvas of this.canvases) {
              canvas.set({ defaultCursor: this.cursorObject.pointer, hoverCursor: this.cursorObject.pointer });
            }
          } else {
            $('.pointer', this.canvas_tool).removeClass('current');
            for (const canvas of this.canvases) {
              canvas.set({ defaultCursor: this.cursorObject.default, hoverCursor: this.cursorObject.default });
            }
          }
          this.sendMessage({
            event: `pointer_${this.cursor}`,
            clientKey: this.channel.clientKey,
          });
        }
      },
      shapesBtn: () => {
        if (this.channel && this.canvasExist) {
          const shapeSubWrap = $('.shapes_tool_wrap', this.canvas_tool);
          if ($('.shapes', this.canvas_tool).hasClass('current')) {
            this.offAll();
          } else {
            this.offAll();
            shapeSubWrap.css('visibility', 'visible');
            $('.shapes', this.canvas_tool).addClass('current');
          }
        }
      },
      penBtn: () => {
        if (this.channel && this.canvasExist) {
          if (this.nowEraseMode) {
            this.setEraseMode(); // turn off eraser mode
          }
          if (this.nowDrawingMode) {
            // turn off pen mode
            this.offAll();
          } else {
            // turn on pen mode
            this.offAll();
            for (const canvas of this.canvases) {
              canvas.set({ freeDrawingCursor: this.cursorObject.pen });
              canvas.isDrawingMode = true;
            }
            $('.pen', this.canvas_tool).addClass('current');
            $('.pen_tool_wrap').css('visibility', 'visible');
          }
        }
      },
      penEvent: () => {
        if (this.channel && this.canvasExist) {
          if (this.nowDrawingMode) {
            $('.pen_tool_wrap').css('visibility', 'visible');
          }
        }
      },
      eraserBtn: () => {
        if (this.channel && this.canvasExist) {
          this.offAll();
          this.setEraseMode();
        }
      },
      eraseAllBtn: () => {
        if (this.channel && this.canvasExist) {
          this.offAll();
          this.currentCanvas.remove(...this.currentCanvas._objects);
          this.currentCanvas.clearHistory();
          this.sendMessage({
            event: `object_eraseAll`,
            target: this.targetIndex,
            clientKey: this.channel.clientKey,
          });
        }
      },
      documentBtn: () => {
        this.dispose(true);
        // this.sendMessage({
        //   event: `canvas_reset`,
        //   clientKey: this.channel.clientKey,
        // });
      },
    };

    // fileShare 버튼 클릭 시 실행
    this.fileBtn.off('click').on('click', this.buttons.fileShareBtn);

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

    // 문서 목록
    $('.document', this.canvas_tool).off('click').on('click', this.buttons.documentBtn);

    // 닫기 버튼
    $('.tool_close', this.canvas_tool).off('click').on('click', this.buttons.fileShareBtn);
  }

  // pen 서브 툴 핸들러
  setPenHandler() {
    $('.pen_tool_wrap .subtool-colorpicker', this.canvas_tool)
      .off('click')
      .on('click', (e) => {
        if (this.channel && this.canvasExist) {
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
        }
      });
    // size buttons
    $('li.stroke', this.canvas_tool).on('click', () => {
      if (this.channel && this.canvasExist) $('.canvas_tool_subwrap.pen_tool_wrap .subtool_wrap li.stroke').removeClass('current');
    });
    $('li.stroke._1px', this.canvas_tool).on('click', () => {
      if (this.channel && this.canvasExist) {
        $('li.stroke._1px', this.canvas_tool).addClass('current');
        this.brush = { width: 1 };
      }
    });
    $('li.stroke._3px', this.canvas_tool).on('click', () => {
      if (this.channel && this.canvasExist) {
        $('li.stroke._3px', this.canvas_tool).addClass('current');
        this.brush = { width: 3 };
      }
    });
    $('li.stroke._5px', this.canvas_tool).on('click', () => {
      if (this.channel && this.canvasExist) {
        $('li.stroke._5px', this.canvas_tool).addClass('current');
        this.brush = { width: 5 };
      }
    });
    $('li.stroke._8px', this.canvas_tool).on('click', () => {
      if (this.channel && this.canvasExist) {
        $('li.stroke._8px', this.canvas_tool).addClass('current');
        this.brush = { width: 8 };
      }
    });
    $('li.stroke._12px', this.canvas_tool).on('click', () => {
      if (this.channel && this.canvasExist) {
        $('li.stroke._12px', this.canvas_tool).addClass('current');
        this.brush = { width: 12 };
      }
    });
  }

  // 도형 서브 툴 핸들러
  setShapeHandler() {
    $('.shapes_tool_wrap .subtool-colorpicker', this.canvas_tool)
      .off()
      .on('click', (e) => {
        if (this.channel && this.canvasExist) {
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
        }
      });
    $('.shape-circle', this.canvas_tool)
      .off()
      .on('click', () => {
        if (this.channel && this.canvasExist) {
          const cir = new Circle({
            top: 100,
            left: 100,
            radius: 50,
            fill: this.shapeColor,
          });
          this.currentCanvas.add(cir);
        }
      });
    $('.shape-rect', this.canvas_tool)
      .off()
      .on('click', () => {
        if (this.channel && this.canvasExist) {
          const rect = new Rect({
            top: 100,
            left: 100,
            width: 100,
            height: 100,
            fill: this.shapeColor,
          });
          this.currentCanvas.add(rect);
        }
      });
    $('.shape-triangle', this.canvas_tool)
      .off()
      .on('click', () => {
        if (this.channel && this.canvasExist) {
          const tri = new Triangle({
            top: 100,
            left: 100,
            width: 100,
            height: 100,
            fill: this.shapeColor,
          });
          this.currentCanvas.add(tri);
        }
      });
  }

  // 지우개 모드 설정
  setEraseMode() {
    if (this.channel && this.canvasExist) {
      if (this.nowEraseMode) {
        // restore brush data
        this.brush = { width: this.brushBackup.width, color: this.brushBackup.color, erase: false };
        // turn off eraser
        $('.eraser', this.canvas_tool).removeClass('current');
        delete this.color;

        this.brushBackup = {};
      } else {
        // back up orignal brush
        this.brushBackup.width = this.brush.width;
        this.brushBackup.color = this.brush.color;
        // turn on eraser
        $('.pen', this.canvas_tool).removeClass('current');
        $('.eraser', this.canvas_tool).addClass('current');
        // set brush width & color to backgroudColor
        this.brush = { erase: true };
      }
    }
  }

  // 모든 기능 끄기
  offAll(option = {}) {
    this.closeAllSubMenu();

    // pointer
    if (!option.dontOffPointer) {
      this.cursor = 'hide';
      $('.pointer', this.canvas_tool).removeClass('current');
      this.sendMessage({
        event: `pointer_hide`,
        clientKey: this.channel.clientKey,
      });
    }

    $('.pen', this.canvas_tool).removeClass('current');
    $('.eraser', this.canvas_tool).removeClass('current');
    for (const canvas of this.canvases) {
      // pointer
      if (!option.dontOffPointer) canvas.set({ defaultCursor: this.cursorObject.default, hoverCursor: this.cursorObject.default });

      // pen
      canvas.set({ freeDrawingCursor: this.cursorObject.default });
      canvas.isDrawingMode = false;

      // eraser
      if (this.nowEraseMode) {
        this.brush.width = this.brushBackup.width;
        this.brush.color = this.color || this.brushBackup.color;
        delete this.color;
      }
    }
  }

  // 모든 서브메뉴 닫기 (도형, 펜 서브 메뉴)
  closeAllSubMenu() {
    // shapes
    $('.shapes', this.canvas_tool).removeClass('current');
    $('.shapes_tool_wrap').css('visibility', 'hidden');
    $('.shapes_tool_wrap .subtool-colorpicker').removeClass('on');
    this.shapeColorPicker.hide();
    // pen
    $('.pen_tool_wrap').css('visibility', 'hidden');
    $('.pen_tool_wrap .subtool-colorpicker').removeClass('on');
    this.brushColorPicker.hide();
  }

  // fabric.js 의 canvas에서 발생하는 이벤트 핸들러 등록
  setCanvasHandler() {
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
            target: this.targetIndex,
            clientKey: this.channel.clientKey,
            obj: json,
          });
        }
      },
      modified: (options) => {
        // console.log('object:modified', options);
        // objects export json
        const obj = options.target.toJSON(this.toJSONOption);
        // console.log(obj);
        // send objects
        this.sendMessage({
          event: 'object_modified',
          target: this.targetIndex,
          clientKey: this.channel.clienteKey,
          obj,
        });
      },
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
        this.waitMenuOff = true; // 메뉴 닫기 대기
      });
    this.mouse = {
      move: (e) => {
        if (this.waitMenuOff) {
          this.waitMenuOff = false;
          this.closeAllSubMenu();
        }
      },
      down: (option) => {
        if (this.nowDrawingMode || this.nowShapesMode) {
          this.closeAllSubMenu();
        }
      },
    };
    this.erasing = {
      end: (option) => {
        const path = option.path.set({ id: this.uuid() }).toJSON(this.toJSONOption);
        const targets = option.targets.map((o) => o.id);
        if (option.targets.length > 0) {
          this.sendMessage({
            event: 'object_erased',
            target: this.targetIndex,
            path,
            targets,
            clientKey: this.channel.clientKey,
          });
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
          this.currentCanvas.remove(...this.selectedTarget);
          this.selectedTarget = null;

          this.sendMessage({
            event: 'object_removed',
            target: this.targetIndex,
            clientKey: this.channel.clientKey,
            ids,
          });
        }
    };

    for (const canvas of this.canvases) {
      canvas.on('object:added', this.object.added);
      canvas.on('object:modified', this.object.modified);

      canvas.on('selection:created', this.selection.created);
      canvas.on('selection:cleared', this.selection.cleared);

      canvas.on('mouse:down', this.mouse.down);
      canvas.on('mouse:move', this.mouse.move);

      canvas.on('erasing:end', this.erasing.end);
    }

    // delete keydown
    // window.addEventListener('keydown', this.deleteHandler);
    const scrollPos = {
      scrollTop: 0,
      scrollLeft: 0,
    };
    this.mouseMoveHandler = (e) => {
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
    };

    // delete key handler
    $(window).on('keydown', this.deleteHandler);
    // share pointer mode
    $(window).on('mousemove', this.mouseMoveHandler);
  }

  /**
   * 파일 목록 변경
   * @param {Object} data 선택한 문서의 데이터 (title: string, fileList: {[key: string]: string}[])
   * @param {boolean} needSend 문서 선택한 사람일 때 true => (문서 공유 on 이벤트 전송)
   */
  async changeFileList(data, needSend = false) {
    // console.log(data);
    if (!data) {
      throw new Error('제목과 파일 목록이 누락되었습니다.');
    } else {
      await this.dispose(false);

      this.title = data.title;
      this.fileList = data.fileList;
      if (needSend) {
        this.owner = this.channel.clientKey;
        this.sendMessage({
          event: 'fileshare_open',
          title: this.title,
          list: this.fileList,
          clientKey: this.channel.clientKey,
        });
      }

      // 초기화 시 마다 다시 실행해야 함
      this.makeHTML();
      this.setCanvases();
      this.setCanvasHandler();

      this.imgClickHandler(0);
      this.resize();
      this.sendMessage('open');
      this.show();
    }
  }

  // 참여자들 에게 받은 이벤트 핸들링
  canvasEvent(data) {
    if (data.clientKey === this.channel.clientKey) return;
    const { event, obj, clientKey, /*cursor,*/ position, target, targets, path, eraser, title, list: fileList, user } = data;
    const canvas = this.canvases[target];
    switch (event) {
      case 'fileshare_open':
        // console.warn('open new file!!! >> ', title, fileList);
        this.owner = clientKey;
        if (!(title === this.title && fileList === this.fileList)) {
          this.webrtc.toastPopup(`${this.channel.users[clientKey].nickName}님이 ${title}을 공유했습니다.`);
          this.changeFileList({ title, fileList }, false);
        }
        break;
      case 'fileshare_open_for_user':
        console.log(user, this.channel.clientKey);
        if (typeof user === 'string' ? user : user.clientKey === this.channel?.clientKey) {
          console.log(title, fileList, !(title === this.title && fileList === this.fileList));
          if (!(title === this.title && fileList === this.fileList)) {
            this.webrtc.toastPopup(`${this.channel.users[clientKey].nickName}님이 ${title}을 공유했습니다.`);
            this.changeFileList({ title, fileList }, false);
          }
        }
        break;
      case 'canvas_change':
        this.targetIndex = target;
        break;
      case 'object_added':
        switch (obj.type) {
          case 'rect':
            new Rect.fromObject(obj, (rect) => {
              canvas.add(rect);
            });
            break;
          case 'triangle':
            new Triangle.fromObject(obj, (tri) => {
              canvas.add(tri);
            });
            break;
          case 'circle':
            new Circle.fromObject(obj, (cir) => {
              canvas.add(cir);
            });
            break;
          case 'path':
            new Path.fromObject(obj, (path) => {
              canvas.add(path);
            });
            break;
        }
        break;
      case 'object_modified':
        const original = this.getCanvasObject(obj.id);
        if (original) {
          if (obj.eraser) delete obj.eraser;
          Object.assign(original, obj);
          canvas.fire('object:modified:byEvent', { target: original });
        }
        canvas.renderAll();
        break;
      case 'object_erased':
        const newEraser = new fabric.EraserBrush();
        // 메서드만 사용하기 위해 canvas 직접 지정
        newEraser.canvas = this.currentCanvas;
        new Path.fromObject(path, (newPath) => {
          // EraserBrush로 만들어진 Path를 사용하여 캔버스에 적용한다.
          newEraser.applyEraserToCanvas(newPath);
          targets.forEach((id) => {
            const obj = this.getCanvasObject(id);
            if (obj && obj.erasable) {
              // 각각의 오브젝트에 eraser오브젝트를 적용시킨다.
              newEraser._addPathToObjectEraser(obj, newPath);
              targets.push(obj);
              // console.log(obj, obj.eraser);
            }
          });

          // 모든 객체를 다시 렌더링
          canvas.requestRenderAll();
        });
        break;
      case 'object_removed':
        const ids = data.ids;
        for (const id of ids) {
          canvas.remove(this.getCanvasObject(id));
        }
        break;
      case 'object_eraseAll':
        canvas.remove(...canvas._objects);
        canvas.clearHistory();
        break;
      // case 'canvas_set':
      //   this.data = data.canvasData;
      //   canvas.renderAll();
      //   break;
      // case 'canvas_undo':
      //   console.warn('undo!');
      //   canvas.undo();
      //   break;
      // case 'canvas_redo':
      //   console.warn('redo!');
      //   canvas.redo();
      //   break;
      case 'pointer_show':
        let pointer = $(`#fs_pointer_${clientKey}`);
        if (pointer.length === 0) {
          pointer = $(this.newPointer);
          pointer.attr('id', `fs_pointer_${clientKey}`);
          $('.file_list_wrap .file_view').append(pointer);
        }
        pointer.show();
        // console.log('pointer show!!', clientKey, pointer);
        break;
      case 'pointer_hide':
        // console.log('pointer hide!!', clientKey);
        $(`#fs_pointer_${clientKey}`).hide();
        break;
      case 'pointer_move':
        $(`#fs_pointer_${clientKey}`).css(position);
        break;
      default:
        console.warn('unknown event >> ', data);
        dd;
    }
  }

  // window가 resize될 때 캔버스 리사이징 (width, height가 px단위로만 사용 가능, 화면 크기에 따라 확대/축소 기능)
  resize() {
    const canvasResize = (canvas, width, height) => {
      // console.log('last size', this.width, this.height);
      const imgRatio = height / width;
      if (imgRatio > 1) {
        // console.log('height is bigger', width, height);
        canvas.setDimensions({ width: this.height / imgRatio, height: this.height });
        canvas.zoomToPoint({ x: 0, y: 0 }, (this.height / canvas.initSize.height) * 1.6);
      } else {
        // console.log('width is bigger', width, height);
        const heightBigger = this.height > this.width * 0.9 * imgRatio;
        canvas.setDimensions({
          width: heightBigger ? this.width * 0.9 : this.height / imgRatio,
          height: heightBigger ? this.width * 0.9 * imgRatio : this.height,
        });
        canvas.zoomToPoint(
          { x: 0, y: 0 },
          heightBigger ? ((this.width * 0.9) / canvas.initSize.width) * 1.6 : (this.height / imgRatio / canvas.initSize.width) * 1.6
        );
      }
    };

    if (this.canvasExist) {
      const canvas = this.currentCanvas;

      if (!canvas?.initSize) {
        let img = new Image();

        img.onload = () => {
          const { width, height } = img;
          const imgRatio = height / width;
          if (imgRatio > 1) canvas.set({ initSize: { width: width / (height / 1170), height: 1170 } });
          else canvas.set({ initSize: { width: 1440, height: height / (width / 1440) } });
          canvas.set({ imgSize: { width, height } });

          canvasResize(canvas, width, height);

          img.onload = null;
        };
        img.src = $(canvas.getElement()).css('background').split('url("')[1].split('")')[0] || this.fileList[this.targetIndex];
      } else {
        const {
          imgSize: { width, height },
        } = canvas;
        canvasResize(canvas, width, height);
      }
    }
  }

  // dispose all canvases
  async dispose(needHelp) {
    try {
      const { list } = await (await fetch(LIST_URL(this.channel.roomId))).json();
      this.documentList = list;
    } catch (error) {
      // console.error(error);
      this.webrtc.alert_popup({ title: '오류', msg: '서버에 접속하는데 실패하였습니다.</br>나중에 다시 시도해주세요.' });
    }

    this.offAll();
    for (const canvas of this.canvases) {
      canvas.dispose();
    }
    this.canvases = [];

    $('.file_view').html(needHelp ? this.documentListUl + this.help : '');
    $('.file_list').html('');
  }

  // make random uuid
  uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      var r = (Math.random() * 16) | 0,
        v = c == 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  getCanvasObject(id) {
    return this.currentCanvas._objects.find((obj) => obj.id === id);
  }

  show() {
    if (!this.nowFileShare) $('.pop_present_subwrap.file_share').trigger('click');
  }
  hide() {
    if (this.nowFileShare) {
      $('.pop_present_subwrap.file_share').trigger('click');
      this.offAll();
    }
  }

  reJoin() {
    // this.setColorPickers();
    // this.setHandler();
    this.setToolHandler();
    this.setPenHandler();
    this.setShapeHandler();
    this.dispose(true); // 초기화
  }

  /**
   * 새 유저 접속 시 실행
   * @param {Object|string} event 새 유저의 접속 이벤트 or 새 유저 클라이언트 키
   */
  remoteStreamAppend(event) {
    if (this.nowFileShare)
      setTimeout(() => {
        if (this.owner === this.channel.clientKey) {
          this.sendMessage({
            event: 'fileshare_open_for_user',
            title: this.title,
            list: this.fileList,
            clientKey: this.channel.clientKey,
            user: typeof event === 'string' ? event : event.clientKey,
          });
        }
      }, 2000);
  }

  get documentListUl() {
    let html = '';
    // documentList가 있을경우 목록 표시
    if (this.documentList) {
      html += '<ul class="upload_document_list">';
      html += `<div>`;
      html += `<div class="document_list_title">`;
      html += `<li class="document_title">파일명</li>`;
      html += `<li class="remove_document">삭제</li>`;
      html += `</div>`;
      html += `<div class="document_list_wrap">`;
      this.documentList.map((document) => {
        html += `<div class="document_list_subwrap">`;
        html += `<li data-file-key="${document.fileKey}">`;
        html += `<div class="document_title">${document.originFileNm}</div>`;
        html += `<div class="remove_document"><i class="fas fa-trash remove_document" aria-hidden="true"></i></div>`;
        html += `</li>`;
        html += `</div>`;
      });
      html += `</div>`;
      html += `</div>`;
      html += '</ul>';
    }
    return html;
  }
  get help() {
    return `<ul class="file help"><li class="title">이곳에 파일을 드래그 하시거나<br>위쪽에 파일 업로드 버튼을 클릭하여<br>문서를 공유하세요!</li><li class="subtitle"><span>pdf, pptx, docx, png, jpg, jpeg, svg 가능</span></br>업로드하신 파일은 하루 뒤 자동으로 삭제됩니다.</li></ul>`;
  }
  get targetIndex() {
    return this._targetIndex;
  }
  set targetIndex(value) {
    this._targetIndex = value;
    this.imgClickHandler(this.targetIndex, false);
  }

  // Path 오브젝트는 수정 불가 설정
  get pathObject() {
    return { selectable: false, hoverCursor: this.cursorObject.default };
  }
  // json으로 변환 시 유지할 속성값
  get toJSONOption() {
    return ['id', 'selectable', 'hasControls'];
  }
  // check presenter
  get presenter() {
    return $('.presenter').hasClass('on');
  }
  // set cursor data
  get cursorObject() {
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
    return $('.shapes', this.canvas_tool).hasClass('current');
  }
  get nowDrawingMode() {
    return this.canvases[0].isDrawingMode && !this.nowEraseMode;
  }
  get nowEraseMode() {
    return Object.getOwnPropertyNames(this.brushBackup).length !== 0;
  }
  get canvasExist() {
    return this.canvases.length > 0;
  }
  get currentCanvas() {
    return this.canvasExist ? this.canvases[this.targetIndex || 0] : null;
  }

  get nowFileShare() {
    return this.fileBtn.hasClass('on');
  }
  get nowWhiteBoard() {
    return $('.pop_present_subwrap.white_board').hasClass('on');
  }
  get nowPresent() {
    return present_mode;
  }

  get width() {
    return window.innerWidth * 0.75;
  }
  get height() {
    return window.innerHeight - 70 - 40;
  }
  get channel() {
    return channel;
  }
  get webrtc() {
    return webrtc;
  }
}

// FileUtil 설정
$(document).ready(function () {
  const fileUtil = new FileUtil({
    roomId: channelKey,
    uploadTag: '.canvas_tool_btn.upload',
    updateEvent: fileUpdate,
    uploadDragTag: '.file_list_wrap .file.help',
    progressTag: '.file_list_wrap .file_progress',
    progressSize: 100,
    progressEvent: function () {},
  });

  fileUtil.upload_url = UPLOAD_URL;

  function fileUpdate(flag, data, res) {
    console.log('fileUpdate >>> ', flag, data, res);

    if (res?.result_cd === 0) {
      webrtc.alert_popup({ title: '오류', msg: res?.result_msg });
      throw new Error(res.result_msg);
    }
    if (flag) {
      $.ajax({
        url: DOWNLOAD_URL(res.fileKey, channel.roomId),
        type: 'GET',
        contentType: false,
        processData: false,
        success: function (res) {
          if (fileUtil.progressFlag) {
            $('.e7works_progressContainer').show();
          }

          const { title, list: fileList } = res;
          webrtc.alert_popup({ title: '성공', msg: '성공적으로 업로드 되었습니다.' });
          fileHelper.changeFileList({ title, fileList }, true);
        },
        error: function (e) {
          update(false, e);
          webrtc.alert_popup({ title: '오류', msg: '업로드 중 오류가 발생하였습니다.' });
          if (fileUtil.progressFlag) {
            $('.e7works_progressContainer').hide();
            $('.e7works_progressNow').css('width', 'calc(0%)');
          }
        },
        complete: function () {
          if (fileUtil.progressFlag) {
            $('.e7works_progressContainer').hide();
            $('.e7works_progressNow').css('width', 'calc(0%)');
          }
        },
      });

      // chatHeight(false, true);
      // channel.sendMessage({
      //   message: JSON.stringify('param'),
      //   messageType: JSON.stringify({ profile: channel.userInfo.profile }),
      //   mimeType: 'screenShareDocument',
      // });
    } else {
      console.log(res);
      webrtc.alert_popup({ title: '오류', msg: '업로드 중 오류가 발생하였습니다.' });
      // toastr.error('파일전송을 실패 했습니다.');
    }
  }
});
