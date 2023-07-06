let private_room = {},
  marster,
  use_list = {},
  all_users,
  present_mode = false,
  history,
  local_event = false,
  start_marster = false,
  close_tid,
  close_cnt,
  res_console,
  res_console_print = {},
  roomPass = false;

window.addEventListener('load', function () {
  // 리소스 로드 res 변수명으로 동작
  if (webrtc === undefined) {
    webrtc = new webRTC('.toast_pop', 400, 3000, 800);
    webrtc.console.action('rtc.js >> ', 'init');
  }

  // 이벤트 시작
  webrtc.defEvent();
});

class webRTC {
  // 토스트 팝업 생성자
  constructor(target, in_fi, in_de, in_fo, option) {
    this.toastLayer = $(target);
    this.fi = in_fi;
    this.de = in_de;
    this.fo = in_fo;
    this.self = this;

    res_console = console;
    if (!res_console_print) {
      res_console_print = {};
    }
    res_console_print.action = true;
    res_console_print.log = false;
    res_console_print.info = true;
    res_console_print.warn = false;
    res_console_print.debug = false;
    res_console_print.table = false;
    res_console_print.error = true;

    if (option) {
      if (option.action) {
        res_console_print.action = option.action;
      }
      if (option.log) {
        res_console_print.log = option.log;
      }
      if (option.info) {
        res_console_print.info = option.info;
      }
      if (option.warn) {
        res_console_print.warn = option.warn;
      }
      if (option.debug) {
        res_console_print.debug = option.debug;
      }
      if (option.table) {
        res_console_print.table = option.table;
      }
      if (option.error) {
        res_console_print.error = option.error;
      }
    }

    this.toastLayer.on('click', () => {
      this.toastLayer.finish().fadeOut(this.fo);
    });
  }
  lineNumber(stack) {
    if (webrtc.low_debug != undefined && webrtc.low_debug) {
      var step1 = stack.substring(stack.indexOf('\n') + 2);
      var step2 = step1.substring(step1.indexOf('\n') + 2);
      var step3 = step2.substring(0, step2.indexOf(')\n'));
      var line = step3.substring(step3.lastIndexOf('/') + 1);
      self.console.log('[debug: ' + line + ']');
    }
  }
  console = {
    action: function () {
      if (res_console_print.action) {
        webrtc.lineNumber(new Error().stack);
        res_console.log.apply(console, arguments);
      }
    },
    low_debug: function () {
      if (webrtc.low_debug != undefined && webrtc.low_debug) {
        webrtc.lineNumber(new Error().stack);
        return res_console.info.apply(console, arguments);
      }
    },
    log: function () {
      if (res_console_print.log) {
        webrtc.lineNumber(new Error().stack);
        return res_console.log.apply(console, arguments);
      }
    },
    info: function () {
      if (res_console_print.info) {
        webrtc.lineNumber(new Error().stack);
        return res_console.info.apply(console, arguments);
      }
    },
    warn: function () {
      if (res_console_print.warn) {
        webrtc.lineNumber(new Error().stack);
        return res_console.warn.apply(console, arguments);
      }
    },
    debug: function () {
      if (res_console_print.debug) {
        webrtc.lineNumber(new Error().stack);
        return res_console.debug.apply(console, arguments);
      }
    },
    table: function () {
      if (res_console_print.table) {
        webrtc.lineNumber(new Error().stack);
        return res_console.table.apply(console, arguments);
      }
    },
    error: function () {
      if (res_console_print.error) {
        webrtc.lineNumber(new Error().stack);
        return res_console.error.apply(console, arguments);
      }
    },
  };

  // 기본적으로 걸려야하는 이벤트 정의
  defEvent() {
    self = this;
    this.console.log(self, this);
    // 접속URL 처리
    $('div.invite_url > div.copy_input > input[type=text]').val(window.location.href);
    $('div.invite_url > div.copy_input > label').click(function (e) {
      var target = $(e.target).siblings('input');
      self.clipboardCopy(target, '접속URL 이 복사되었습니다.');
    });
    // pw 설정 처리
    $('div.lock_password div.copy_input label').click(function (e) {
      var target = $(e.target).siblings('input');
      if (target[0].value.length > 0) {
        self.clipboardCopy(target, '비밀번호가 복사되었습니다.');
      } else {
        self.toastPopup('비밀번호를 입력해 주세요.');
      }
    });
    // 비밀번호 자동 생성
    $('.auto_password').click(function (e) {
      $('.lock_password .copy_input input').val(webrtc.create_password());
    });

    // 화면 잠금 팝업 show hide
    $('.lock_btn label input[type=checkbox]').on('change', function () {
      if ($('.lock_btn label input[type=checkbox]').is(':checked')) {
        $('.lock_password').slideDown();
      } else {
        $('.lock_password').slideUp();
      }
    });

    // 발표자 팝업 show hide
    $('.present_btn label input[type=checkbox]').on('change', function () {
      if ($('.present_btn label input[type=checkbox]').is(':checked')) {
        $('.present_view_btn, .lock_btn').slideDown();
        if ($('.lock_btn input[type=checkbox]').is(':checked')) {
          $('.lock_password').slideDown();
        }
      } else {
        $('.present_view_btn, .lock_btn, .lock_password').slideUp();
      }
    });

    $('.cam_list').sortable({
      // 드래그 앤 드롭 단위 css 선택자
      connectWith: '.cam_move',
      // 움직이는 css 선택자
      handle: '.cam_move_wrap',
      // 움직이지 못하는 css 선택자
      cancel: '.no-move',
      // 이동하려는 location에 추가 되는 클래스
      placeholder: 'video-placeholder',
      // 이동할때 커서모양
      cursor: 'grabbing',
      forcePlaceholderSize: true,

      /* 이동할 위치 css 적용 */
      start: function (event, ui) {
        // 드래그 시작 시 호출
        // ui.item.height('123px');

        // now set the new height to the placeholder
        // $(ui.placeholder[0]).height(ui.item.height());
        self.console.log('sortable event start', event, ui);
      },
      stop: function (event, ui) {
        // 드래그 종료 시 호출
        self.console.log('sortable event stop', event, ui);
        //reorder();
      },
    });

    // 마우스 오버시 처리
    $(document).mouseup(function (e) {
      if (!self.lock_item.is(e.target) && !self.pop_lock.is(e.target) && self.pop_lock.has(e.target).length === 0) {
        self.pop_lock.removeClass('active');
      }
      if (!self.invite_item.is(e.target) && !self.pop_invite.is(e.target) && self.pop_invite.has(e.target).length === 0) {
        self.pop_invite.hide();
      }
      if (!self.presenter_item.is(e.target) && !self.pop_present_mode.is(e.target) && self.pop_present_mode.has(e.target).length === 0) {
        self.pop_present_mode.removeClass('active');
      }
      if (!self.user_list_item.is(e.target) && !self.pop_user_list.is(e.target) && self.pop_user_list.has(e.target).length === 0) {
        self.pop_user_list.hide();
      }
      if (!self.setting_item.is(e.target) && !self.pop_setmenu_wrap.is(e.target) && self.pop_setmenu_wrap.has(e.target).length === 0) {
        self.pop_setmenu_wrap.removeClass('active');
      }
      if (!self.present_item.is(e.target) && !self.pop_screen_share.is(e.target) && self.pop_screen_share.has(e.target).length === 0) {
        self.pop_screen_share.removeClass('active');
      }
    });

    // 화면 더블클릭 전체 화면화
    $('video_area').dblclick(function () {
      self.toggleFullScreen(!document.fullscreenElement);
    });
  }

  // 커스텀 메시지 시작
  customInit = (_history, roomPass) => {
    self = this;
    this.console.log(self, this);
    if (roomPass) {
      private_room.roomPass = roomPass;
    } else {
      private_room.roomPass = false;
    }
    history = _history;
    self.console.action('>> 커스텀 이벤트 시작');

    Object.defineProperty(private_room, 'marster', {
      get: function () {
        return this._marster;
      },
      set: function (val) {
        if (val) {
          this._marster = val;
          marster = channel.clientKey;
          self.presenter_item.attr({ class: 'footer_navi_ico ico_presenter on' });
          if (!$('.present_btn label input[type=checkbox]').is(':checked')) {
            $('div.present_btn > label > input[type=checkbox]').trigger('click');
            fabricWrapper.hide();
            fileHelper.hide();
          }
          self.marster_view(channel.clientKey);
          self.customSend({
            marster_chg: {
              clientKey: channel.clientKey,
              nickName: channel.nickName,
              share: private_room.share,
            },
          });
          use_list[channel.clientKey].marster = true;
        } else {
          if (this._marster == true && start_marster) {
            self.customSend({
              marster_end: {
                clientKey: channel.clientKey,
                nickName: channel.nickName,
                share: private_room.share,
              },
            });
          }
          start_marster = false;
          this._marster = undefined;
          self.presenter_item.attr({ class: 'footer_navi_ico ico_presenter off' });
          if ($('.present_btn label input[type=checkbox]').is(':checked')) {
            $('div.present_btn > label > input[type=checkbox]').trigger('click');
          }
        }
      },
    });

    self.customSend({
      private_check: 'true',
    });

    let w = 0;
    channel.onNotifyCustom = function (event) {
      var msg = JSON.parse(event.message);
      var remote_key = event.clientKey;
      self.console.log('커스텀 로그[' + remote_key + ']', msg, event);
      // 공통기능
      if (msg.type == 'allExit') {
        self.alert_popup({ title: '공지', msg: '채팅방이 종료되었습니다.', timeout: 5 }, function () {
          self.rtcLogout();
        });
        // } else if (msg.fabric) {
      } else if (remote_key == channel.clientKey) {
        // 자기 자신 메시지
        if (msg.private_check) {
          // 첫 시작 use_list 에 등록
          use_list[channel.clientKey] = {
            nickName: channel.nickName,
          };
          // 화면 생성 시작
          self.videoInit();
        } else if (msg.marster_chg) {
          // 마스터 변경 처리
          private_room.share_lock = false;
          marster = channel.clientKey;
          self.allUserList();
          if (start_marster) {
            // 마스터가 되었을 경우 메시지
            if (msg.marster_chg.share) {
              self.toastPopup('발표 권한을 제한하였습니다.');
            } else {
              self.toastPopup('발표 제한을 해제하였습니다.');
            }
          } else {
            // 처음 마스터가 되었을 경우 메시지
            start_marster = true;
            private_room.lock = false;
            self.lock_item.attr({ class: 'room_unlock' });
            self.object_delete(private_room, 'password');
            self.toastPopup('발표자가 되었습니다.' + ' 발표 제한 [ ' + (msg.marster_chg.share ? '사용' : '미사용') + ' ]');
            // fabric.js
            // fabricWrapper.changePresenter(true);
          }
        } else if (msg.marster_end) {
          // 마스터 종료시 처리
          self.toastPopup('발표자 모드를 종료하였습니다.');
          use_list[msg.marster_end.clientKey].marster = false;
          private_room.lock = false;
          private_room.lock_stat = false;
          private_room.share = false;
          self.lock_item.attr({ class: 'room_unlock' });
          self.object_delete(private_room, 'password');
          self.allUserList();
        } else if (msg.audio_chg) {
          // 오디오 변경 처리
          self.console.log('me custeom audio_chg', msg);
          if (msg.audio_chg.targetClientKey == channel.clientKey) {
            self.mic.toggle($(self.mic_item).hasClass('off'));
          }
        } else if (msg.video_chg) {
          // 비디오 변경 처리
          self.console.log('me custeom video_chg', msg);
          if (msg.video_chg.targetClientKey == channel.clientKey) {
            self.cam.toggle($(self.camera_item).hasClass('off'));
          }
        } else if (msg.kick_user) {
          // 추방 유저 처리
          self.console.log('kick_user >>', msg.kick_user.clientKey);
          self.toastPopup('[ ' + msg.kick_user.nickName + ' ] 님을 추방하였습니다.');
        } else if (msg.lock) {
          // 화면 잠금 처리
          self.console.log('lock >>', msg.lock);
          if (msg.lock.lock_stat) {
            self.toastPopup('화면 잠금이 설정되었습니다. [pw: ' + msg.lock.lock_pw + ']');
          } else {
            self.toastPopup('화면 잠금이 해제되었습니다.');
          }
        } else if (msg.sendActiveUserList) {
          self.console.log('-요청자-', msg);
        } else if (msg.activeUserList) {
          self.console.log('-내 정보-', msg);
        }
      } else {
        // 다른 클라이언트에서 온 메시지 처리
        if (msg.private_check) {
          // 첫 시작시 처리 (클라이언트 정보 전송)
          var param = {
            private_hi: {
              clientKey: channel.clientKey,
            },
          };
          // 마스터인경우 설정되어진 정보 전달
          if (private_room.marster) {
            param.private_hi.master = true;
            param.private_hi.share = private_room.share;
            if (private_room.lock_stat) {
              param.private_hi.lock = true;
              param.private_hi.password = private_room.lock_pw;
            }
          }
          if (!use_list[event.clientKey]) {
            use_list[event.clientKey] = {
              clientKey: event.clientKey,
              nickName: event.nickName,
            };
          }
          self.customSend(param);
          return false;
        } else if (msg.private_hi) {
          // 클라이언트에게서 받은 정보 저장
          use_list[msg.private_hi.clientKey] = {
            nickName: event.nickName,
          };
          // 마스터에게서 온 정보 저장
          if (msg.private_hi.master) {
            private_room.marster = false;
            private_room.share = false;
            use_list[msg.private_hi.clientKey].marster = true;
            marster = msg.private_hi.clientKey;
            if (msg.private_hi.lock) {
              private_room.lock = msg.private_hi.lock;
              private_room.password = msg.private_hi.password;
              self.lock_item.attr({ class: 'room_lock' });
            } else {
              private_room.lock = false;
              self.object_delete(private_room, 'password');
              self.lock_item.attr({ class: 'room_unlock' });
            }
            if (msg.private_hi.share) {
              if (present_mode) {
                self.present_item.trigger('click');
              }
              private_room.share_lock = true;
            } else {
              private_room.share_lock = false;
            }
          }
        } else if (msg.marster_chg) {
          // 마스터 변경 처리
          var check_marster = marster;
          var check_share_lock = private_room.share_lock;
          marster = msg.marster_chg.clientKey;
          self.allUserList();
          self.console.log('마스터가 변경이 되었다!!', msg, marster != check_marster);
          // 기존 권한 삭제
          Object.keys(use_list).forEach(function (key, index, list) {
            use_list[key].marster = false;
          });

          // 공유 제한설정
          if (msg.marster_chg.share) {
            if (present_mode) {
              self.present_item.trigger('click');
            }
            private_room.share_lock = true;
          } else {
            private_room.share_lock = false;
          }

          if (marster != check_marster) {
            // 마스터가 기존과 다를 경우
            start_marster = false;
            private_room.lock_stat = false;
            private_room.share = false;
            private_room.lock = false;
            self.object_delete(private_room, 'lock_pw');
            self.object_delete(private_room, 'password');
            self.lock_item.attr({ class: 'room_unlock' });
            self.toastPopup('[ ' + msg.marster_chg.nickName + ' ] 님이 발표자가 되었습니다.');
            // fabric.js
            // fabricWrapper.changePresenter(false);
            if (private_room.share_lock != check_share_lock) {
              self.toastPopup(
                '[ ' + msg.marster_chg.nickName + ' ] 님이 발표자가 되었습니다.' + ' 발표 제한 [ ' + (private_room.share_lock ? '사용' : '미사용') + ' ]'
              );
            }
            self.pop_present_mode.removeClass('active');
            self.pop_lock.removeClass('active');
          } else {
            // 마스터가 기존과 동일한경우
            if (private_room.share_lock != check_share_lock) {
              if (private_room.share_lock) {
                self.toastPopup('[ ' + msg.marster_chg.nickName + ' ] 님이 발표 권한을 제한하였습니다.');
              } else {
                self.toastPopup('[ ' + msg.marster_chg.nickName + ' ] 님이 발표 제한을 해제하였습니다.');
              }
            }
          }
          private_room.marster = false;
          private_room.share = false;

          if (use_list[msg.marster_chg.clientKey]) {
            use_list[msg.marster_chg.clientKey].marster = true;
          } else {
            use_list[msg.marster_chg.clientKey] = {
              nickName: event.nickName,
            };
            use_list[msg.marster_chg.clientKey].marster = true;
          }

          self.marster_view(msg.marster_chg.clientKey);
        } else if (msg.marster_end) {
          marster = undefined;
          self.toastPopup('[ ' + msg.marster_end.nickName + ' ] 님이 발표자 모드를 종료하였습니다.');
          private_room.share_lock = false;
          use_list[msg.marster_end.clientKey].marster = false;
          private_room.lock = false;
          self.lock_item.attr({ class: 'room_unlock' });
          self.object_delete(private_room, 'password');
          self.allUserList();
        } else if (msg.audio_chg) {
          self.console.log('custeom audio_chg', msg);
          if (msg.audio_chg.targetClientKey == channel.clientKey) {
            var mic_status = $(self.mic_item).hasClass('off');
            self.mic.toggle(mic_status);
            setTimeout(function () {
              // self.toastPopup("[ " + msg.audio_chg.nickName + " ] 님이 [ " + msg.audio_chg.targetNickName + " ] 님의 마이크를 " + (mic_status ? "ON" : "OFF") + " 하였습니다.");
              self.toastPopup('[ ' + msg.audio_chg.nickName + ' ] 님이 마이크를 ' + (mic_status ? 'ON' : 'OFF') + ' 하였습니다.');
            }, 10);
          }
        } else if (msg.video_chg) {
          self.console.log('custeom video_chg', msg);
          if (msg.video_chg.targetClientKey == channel.clientKey) {
            var cam_status = $(self.camera_item).hasClass('off');
            self.cam.toggle(cam_status);
            setTimeout(function () {
              // self.toastPopup("[ " + msg.video_chg.nickName + " ] 님이 [ " + msg.video_chg.targetNickName + " ] 님의 카메라를 " + (cam_status ? "ON" : "OFF") + " 하였습니다.");
              self.toastPopup('[ ' + msg.video_chg.nickName + ' ] 님이 카메라를 ' + (cam_status ? 'ON' : 'OFF') + ' 하였습니다.');
            }, 10);
          }
        } else if (msg.kick_user) {
          if (msg.kick_user.clientKey == channel.clientKey) {
            self.alert_popup({ title: '알림', msg: '발표자에 의해 추방되었습니다.', timeout: 5 }, function () {
              self.rtcLogout();
            });
          }
          self.console.log('kick ?? ', msg.kick_user.clientKey == channel.clientKey);
          self.console.log('who >>', msg.kick_user.clientKey);
        } else if (msg.lock) {
          self.console.log('lock >>', msg.lock);
          if (msg.lock.lock_stat) {
            self.toastPopup('화면 잠금이 설정되었습니다. [pw: ' + msg.lock.lock_pw + ']');
            private_room.lock = msg.lock.lock_stat;
            private_room.password = msg.lock.lock_pw;
            self.lock_item.attr({ class: 'room_lock' });
          } else {
            self.toastPopup('화면 잠금이 해제되었습니다.');
            private_room.lock = false;
            self.lock_item.attr({ class: 'room_unlock' });
            self.object_delete(private_room, 'password');
          }
        } else if (msg.sendActiveUserList) {
          self.sendCustom({
            activeUserList: {
              clientKey: channel.clientKey,
              nickName: channel.nickName,
              audio: $(self.mic_item).hasClass('on'),
              video: $(self.camera_item).hasClass('on'),
            },
          });
        } else if (msg.activeUserList) {
          if (!use_list[msg.activeUserList.clientKey]) {
            use_list[msg.activeUserList.clientKey] = {
              clientKey: event.msg.activeUserList.clientKey,
              nickName: event.msg.activeUserList.nickName,
              audio: event.msg.activeUserList.audio,
              video: event.msg.activeUserList.video,
            };
          } else {
            use_list[msg.activeUserList.clientKey].audio = event.msg.activeUserList.audio;
            use_list[msg.activeUserList.clientKey].video = event.msg.activeUserList.video;
          }
        }
      }
    };
  };

  // 비디오 태그 이벤트
  videoInit() {
    self = this;
    this.console.log(self, this);
    present_mode = false;
    toastr.options = {
      positionClass: 'toast-top-left',
      progressBar: true,
      timeOut: 10000,
      onclick: function () {
        self.toggleFullScreen(true);
      },
    };
    toastr.success('팝업을 클릭하시면 전체화면으로 서비스를 진행하실 수 있습니다.', '전체화면');

    self.console.action('비디오 이벤트 시작 >>');
    // local webRTC 추가시
    channel.on('rtcLocalStreamAppend', function (event) {
      local_event = true;
      self.console.low_debug('Local append', event);
      setTimeout(
        self.marster_check(function (event) {
          channel.setRTCLocalMedia(self.videoInTag(event));
          self.allUserList();
        }, event),
        10
      );
    });
    // local webRTC 종료시
    channel.on('rtcLocalStreamRemove', function (event) {
      self.console.low_debug('Local remove', event);
      self.videoOutTag(event);
    });
    // remote webRTC 추가시
    channel.on('rtcRemoteStreamAppend', function (event) {
      self.console.low_debug('Remote append', event);
      setTimeout(
        self.re_marster_check(function (event) {
          channel.setRTCRemoteMedia(self.videoInTag(event));
          self.allUserList();
          remoteStreamAppendForSetting();
          fileHelper.remoteStreamAppend(event);
          fabricWrapper.remoteStreamAppend(event);
        }, event),
        10
      );
    });
    // remote webRTC 종료시
    channel.on('rtcRemoteStreamRemove', function (event) {
      self.console.low_debug('Remote remove', event);
      self.object_delete(use_list, event.clientKey);
      setTimeout(
        self.re_marster_check(function (event) {
          self.videoOutTag(event);
        }, event),
        10
      );
    });
    // local 오디오 변경
    channel.on('rtcLocalAudioChanged', function (event) {
      self.console.low_debug('Local audio', event);
      self.audioCng(event);
      if (event.enable) {
        self.toastPopup('마이크가 켜졌습니다.');
        $(self.mic_item).attr({ class: 'footer_navi_ico ico_mic on' });
      } else {
        self.toastPopup('마이크가 꺼졌습니다.');
        $(self.mic_item).attr({ class: 'footer_navi_ico ico_mic off' });
      }
    });
    // local 비디오 변경
    channel.on('rtcLocalVideoChanged', function (event) {
      self.console.low_debug('Local video', event);
      self.videoCng(event);
      if (event.enable) {
        self.toastPopup('카메라가 켜졌습니다.');
        $(self.camera_item).attr({ class: 'footer_navi_ico ico_camera on' });
      } else {
        self.toastPopup('카메라가 꺼졌습니다.');
        $(self.camera_item).attr({ class: 'footer_navi_ico ico_camera off' });
      }
    });
    // remote 오디오 변경
    channel.on('rtcRemoteAudioChanged', function (event) {
      self.console.low_debug('Remote audio', event);
      self.audioCng(event);
    });
    // remote 비디오 변경
    channel.on('rtcRemoteVideoChanged', function (event) {
      self.console.low_debug('Remote video', event);
      self.videoCng(event);
    });
  }

  // webRTC 시작
  rtcStart() {
    self = this;
    this.console.log(self, this);
    self.console.log('>> rtcStart 시작');
    self.chatStart();
    self.footer_nav(true);
  }

  // 채팅 이벤트 시작
  chatStart() {
    self = this;
    this.console.log(self, this);
    self.console.action('>> 일반 채팅 시작', history);

    chatInit();
    personalInit();
    msgInit();
    max_count(50); // 최대 입력글자

    var noticeMsg = true;
    if (typeof write == 'function')
      history &&
        history.forEach(function (m) {
          if (m.messageType == 'notice') {
            // 공지는 하나만 적용
            if (noticeMsg) {
              noticeMsg = false;
              write(m, 'notice', true);
            }
          } else {
            write(m, '', true);
          }
        });
    self.title_item.text(channel.roomName);
  }

  // 방 정보
  privateRoom(pass) {
    self = this;
    this.console.log(self, this);
    self.console.error(channel.nickName);
    let nick = channel.nickName;
    self.rtcLogout();
    self.login.hide();
    let closed_login = self.closed_login.show();

    $('input', closed_login)
      .focus()
      .keyup(function (e) {
        $('input', closed_login).attr({ class: 'password', placeholder: '패스워드를 입력해 주세요.' });
        if (e.keyCode == 13) {
          $('button.rtc3_login_btn', closed_login).trigger('click');
        }
      });

    $('button.rtc3_login_btn', closed_login).click(function () {
      if (pass == $('input', closed_login).val()) {
        closed_login.hide();
        self.console.action('rtc.js >> ', 'login start');
        joinRoom(
          channelKey,
          'xxxxxxxxxxxx'.replace(/[xy]/g, function (a, b) {
            return (b = Math.random() * 16), (a == 'y' ? (b & 3) | 8 : b | 0).toString(16);
          }),
          nick,
          function (err, history) {
            if (err) {
              console.error(err);
              self.login.hide();
              self.alert_popup({ title: '오류', msg: errMsg[err.code].kor }, function () {
                self.rtcLogout();
              });
            } else {
              self.login.hide();
              // 기존 대화내용 삭제
              $('.chat_field > p').remove();
              self.console.log('????');
              self.customInit(history, true);
            }
          }
        );
      } else {
        $('input', closed_login).val('');
        $('input', closed_login).attr({ class: 'password err', placeholder: '패스워드가 틀렸습니다.' });
      }
    });
  }

  // 전체화면모드
  toggleFullScreen(flag) {
    if (!document.fullscreenElement) {
      if (flag) {
        var element = document.documentElement;
        if (element.requestFullscreen) {
          element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
          element.webkitRequestFullscreen();
        } else if (element.mozRequestFullScreen) {
          element.mozRequestFullScreen();
        } else if (element.msRequestFullscreen) {
          element.msRequestFullscreen();
        }
      }
    } else {
      if (!flag) {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitCancelFullscreen) {
          document.webkitCancelFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      }
    }
  }

  // 비디오 태그 html
  get video_html_tag() {
    return '<div class="cam_move"><div class="cam_move_wrap"><div class="mic_off"></div><div class="cam_user_name">사용자 이름</div><div class="camvideo"><video autoplay=""></video></div></div></div>';
  }

  // 유저 목록 태그 html
  get user_html_tag() {
    return '<ul><li class="user_name"><span class="ico_present_mode"></span><div class="name"></div><div class="my_name"></div></li><li class="ico_mic on"></li><li class="ico_camera on"></li><li class="ico_out" style="display:none;"></li></ul>';
  }

  // 제목, 토스트 팝업, 알럿 팝업
  get title_item() {
    return $('#wrap footer ul.navi01 .rtc_name');
  }
  get toast_item() {
    return $('#wrap > section > div.toast_pop');
  }

  // 로그인창 태그
  get login() {
    return $('div.rtc3_login:nth-child(1)');
  }
  get closed_login() {
    return $('div.rtc3_login:nth-child(2)');
  }

  // video 태그 붙이는 곳
  get video_area_item() {
    return $('div.video_area');
  }
  get present_cam_item() {
    return $('div.video_area div.present_cam');
  }
  get cam_list_item() {
    return $('div.video_area div.cam_list');
  }

  // footer item
  get lock_item() {
    return $('#wrap > footer .room_lock, #wrap > footer .room_unlock');
  }
  get invite_item() {
    return $('#wrap > footer .ico_invite');
  }
  get presenter_item() {
    return $('#wrap > footer .ico_presenter');
  }
  get mic_item() {
    return $('#wrap > footer .navi03 .ico_mic');
  }
  get exit_item() {
    return $('#wrap > footer .navi03 .ico_exit');
  }
  get camera_item() {
    return $('#wrap > footer .navi03 .ico_camera');
  }
  get setting_item() {
    return $('#wrap > footer .navi03 .ico_setting');
  }
  get present_item() {
    return $('#wrap > footer .ico_present');
  }
  get user_list_item() {
    return $('#wrap > footer .ico_userlist');
  }
  get chat_item() {
    return $('#wrap > footer .ico_chat');
  }

  // footer popup
  get pop_lock() {
    return $('#wrap .lock_btn');
  }
  get pop_invite() {
    return $('#wrap div.popup_bg.pop_invite');
  }
  get invite_btn() {
    return $('#wrap div.popup_bg.pop_invite > div.invite_mail > div.invite_mail_wrap > button');
  }
  get pop_setmenu_wrap() {
    return $('#wrap div.popup_bg.pop_setmenu_wrap');
  }
  // 설정창 서브 메뉴
  get popup_setting_dim() {
    return $('#wrap .popup_setting_dim');
  }
  get popup_setting_wrap() {
    return $('#wrap .popup_setting_dim .popup_setting_wrap');
  }
  get setting_window() {
    return {
      voice: {
        wrap: $('#wrap .popup_setting_dim > div:nth-child(1)'),
        save: $('#wrap .popup_setting_dim > div:nth-child(1) .popup_setting_btn.save'),
        reset: $('#wrap .popup_setting_dim > div:nth-child(1) .popup_setting_btn.reset'),
        close: $('#wrap .popup_setting_dim > div:nth-child(1) .popup_setting_btn.close'),
      },
      video: {
        wrap: $('#wrap .popup_setting_dim > div:nth-child(2)'),
        save: $('#wrap .popup_setting_dim > div:nth-child(2) .popup_setting_btn.save'),
        reset: $('#wrap .popup_setting_dim > div:nth-child(2) .popup_setting_btn.reset'),
        close: $('#wrap .popup_setting_dim > div:nth-child(2) .popup_setting_btn.close'),
      },
      background: {
        wrap: $('#wrap .popup_setting_dim > div:nth-child(3)'),
        save: $('#wrap .popup_setting_dim > div:nth-child(3) .popup_setting_btn.save'),
        reset: $('#wrap .popup_setting_dim > div:nth-child(3) .popup_setting_btn.reset'),
        close: $('#wrap .popup_setting_dim > div:nth-child(3) .popup_setting_btn.close'),
      },
    };
  }
  get popup_setting_btn_save() {
    return $('#wrap .popup_setting_dim .popup_setting_btn.save');
  }
  get popup_setting_btn_reset() {
    return $('#wrap .popup_setting_dim .popup_setting_btn.reset');
  }
  get popup_setting_btn_close() {
    return $('#wrap .popup_setting_dim .popup_setting_btn.close');
  }
  // 버튼
  get voice_setting() {
    return $('#wrap div.popup_bg.pop_setmenu_wrap .voice_setting');
  }
  get video_setting() {
    return $('#wrap div.popup_bg.pop_setmenu_wrap .video_setting');
  }
  get background_setting() {
    return $('#wrap div.popup_bg.pop_setmenu_wrap .background_setting');
  }
  get pop_present_mode() {
    return $('#wrap div.popup_bg.pop_present_mode');
  }
  get pop_screen_share() {
    return $('#wrap div.popup_bg.pop_present_wrap');
  }
  // 화면공유 서브 메뉴
  get screen_share() {
    return $('#wrap .pop_present_subwrap.screen_share');
  }
  get file_share() {
    return $('#wrap .pop_present_subwrap.file_share');
  }
  get white_board() {
    return $('#wrap .pop_present_subwrap.white_board');
  }
  get pop_user_list() {
    return $('#wrap div.popup_bg.pop_user_list');
  }
  get user_list_count() {
    return $('#wrap div.popup_bg.pop_user_list .user_list_count');
  }
  get user_list_wrap() {
    return $('#wrap div.popup_bg.pop_user_list > div.user_list_wrap');
  }

  get chat_wrap() {
    return $('#wrap div.chat_wrap');
  }

  get chat_help_wrap() {
    return $('#wrap div.chat_wrap > div.chat_help_wrap');
  }

  get chat_help_on() {
    return $('#wrap div.chat_wrap > div.chat_subwrap > div.chat_title > ul > li.help');
  }

  get chat_help_off() {
    return $('#wrap div.chat_wrap > div.chat_help_wrap > div.chat_help > div.chat_help_close');
  }

  get popup_item() {
    return $('#wrap section > article > div.rtc3_login_wrap > div.alret_wrap');
  }

  // textarea, input 태그에 있는 값을 읽어 클립보드로 복사
  clipboardCopy(target, msg) {
    self = this;
    this.console.log(self, this);
    if (target) {
      var _val = $(target)[0];
      if (navigator.clipboard) {
        navigator.clipboard.writeText(_val.value);
      } else {
        _val.select();
        _val.setSelectionRange(0, 99999);
        document.execCommand('Copy');
        _val.setSelectionRange(0, 0);
      }
      self.toastPopup(msg);
    }
  }
  // 텍스트만 넘겨서 클립보드로 복사
  directClipboardCopy(data) {
    var textArea = document.createElement('textarea');
    document.body.appendChild(textArea);
    textArea.value = data;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textArea.value);
    } else {
      textArea.select();
      textArea.setSelectionRange(0, 99999);
      document.execCommand('copy');
      textArea.setSelectionRange(0, 0);
    }
    document.body.removeChild(textArea);
  }
  // 4자리 패스워드 랜덤생성
  create_password() {
    return Math.floor(Math.random() * 1632958 + 46656).toString(36);
  }
  // 오브젝트 값 삭제
  object_delete(obj, name) {
    if (name in obj) {
      delete obj[name];
    }
  }
  // 알럿 타임아웃
  alert_timeout() {
    self = this;
    this.console.log(self, this);
    var ok = $('div.alret_btn_wrap > button:nth-child(1)', self.popup_item);
    if (close_cnt > 0) {
      ok.text('확인 (' + close_cnt + ')');
      close_cnt--;
    } else {
      ok.text('확인');
      ok.trigger('click');
    }
  }
  // 알럿 팝업
  alert_popup(option, fn) {
    self = this;
    this.console.log(self, this);
    if (option) {
      if (option.title) {
        $('p.alret-title', this.popup_item).html(option.title);
      }
      if (option.msg) {
        $('div.alret', this.popup_item).html(option.msg);
      }
      if (option.timeout) {
        if (option.timeout > 30) {
          close_cnt = 30;
        } else {
          close_cnt = option.timeout;
        }
        close_tid = setInterval(() => {
          self.alert_timeout();
        }, 1000);
      }
    }
    var ok = $('div.alret_btn_wrap > button:nth-child(1)', this.popup_item);
    $('div.alret_btn_wrap > button:nth-child(2)', this.popup_item).hide();
    ok.off().on({
      click: function () {
        self.popup_item.hide();
        if (typeof fn === 'function') {
          fn(true);
        }
        if (close_tid) {
          clearInterval(close_tid);
        }
      },
    });

    self.popup_item.show();
  }
  // 확인 팝업
  confirm_popup(option, ok_fn, cancel_fn) {
    self = this;
    this.console.log(self, this);
    if (option.title) {
      $('p.alret-title', this.popup_item).html(option.title);
    }
    if (option.msg) {
      $('div.alret', this.popup_item).html(option.msg);
    }
    var ok = $('div.alret_btn_wrap > button:nth-child(1)', this.popup_item);
    var cancel = $('div.alret_btn_wrap > button:nth-child(2)', this.popup_item).show();

    ok.off().on('click', function () {
      self.popup_item.hide();
      if (typeof ok_fn === 'function') {
        ok_fn(true);
      }
    });

    cancel.off().on('click', function () {
      self.popup_item.hide();
      if (typeof cancel_fn === 'function') {
        cancel_fn(true);
      }
    });
    self.popup_item.show();
  }
  // 이메일 형식 체크
  checkEmail(str) {
    if (/^([0-9a-zA-Z_\.-]+)@([0-9a-zA-Z_-]+)(\.[0-9a-zA-Z_-]+){1,2}$/.test(str)) {
      return true;
    } else {
      return false;
    }
  }
  // 유저목록 리스트
  allUserList() {
    self = this;
    this.console.log(self, this);
    channel.getAllUserList(function (err, list) {
      if (err) {
        return false;
      } else {
        all_users = [];
        self.user_list_wrap.empty();
        self.user_list_count.text(list.length.toString().padStart(2, '0'));
        self.console.log(list.length);
        var i = 0;
        for (var item in list) {
          self.console.log(
            'alluser[' + list[item].clientKey + ']',
            list[item].clientKey == channel.clientKey,
            marster == channel.clientKey,
            list[item].clientKey == marster
          );

          var html = $(self.user_html_tag).attr({ name: list[item].clientKey, nick: list[item].nickName });

          // 기본값 처리
          if (use_list[list[item].clientKey]) {
            if (use_list[list[item].clientKey].audio == false) {
              $('li.ico_mic', html).attr({ class: 'ico_mic off' });
            }
            if (use_list[list[item].clientKey].video == false) {
              $('li.ico_camera', html).attr({ class: 'ico_camera off' });
            }
          }

          // 이름 입력
          $('li.user_name > div.name', html).text(list[item].nickName);

          // 자신인 경우 내 이름별칭 추가
          if (list[item].clientKey == channel.clientKey) {
            $('li.user_name > div.my_name', html).text('(나)').css({ opacity: '0.8', 'font-weight': 'bolder' });
          }

          // 마스터인경우
          if (marster == channel.clientKey && use_list[channel.clientKey] != undefined && use_list[channel.clientKey].marster) {
            $('li.ico_out', html).show();
            if (list[item].clientKey != channel.clientKey) {
              self.allUserListEvent(html, true);
            } else {
              self.allUserListEvent(html, false);
            }
          }

          if (list[item].clientKey == marster && use_list[list[item].clientKey] != undefined && use_list[list[item].clientKey].marster) {
            $('li.user_name > span.ico_present_mode', html).css({ display: 'inline-block' });
          }

          self.user_list_wrap.append(html);
        }
      }
    });
  }
  // 마스터 권한 이벤트
  allUserListEvent(tag, flag) {
    self = this;
    this.console.log(self, this);
    $('.ico_mic', tag).click(function (e) {
      self.console.log($(e.currentTarget).hasClass('off'));
      self.console.log('마이크 대상 [' + $(e.target).parents('ul').attr('name') + ']');
      self.console.log('이름 :: ', $(e.target).parents('ul').attr('nick'));
      self.customSend({
        audio_chg: {
          clientKey: channel.clientKey,
          nickName: channel.nickName,
          targetClientKey: $(e.target).parents('ul').attr('name'),
          targetNickName: $(e.target).parents('ul').attr('nick'),
        },
      });
    });
    $('.ico_camera', tag).click(function (e) {
      self.console.log($(e.currentTarget).hasClass('off'));
      self.console.log('카메라 대상 [' + $(e.target).parents('ul').attr('name') + ']');
      self.console.log('이름 :: ', $(e.target).parents('ul').attr('nick'));
      self.customSend({
        video_chg: {
          clientKey: channel.clientKey,
          nickName: channel.nickName,
          targetClientKey: $(e.target).parents('ul').attr('name'),
          targetNickName: $(e.target).parents('ul').attr('nick'),
        },
      });
    });
    $('.ico_out', tag).click(function (e) {
      if (flag) {
        self.confirm_popup(
          { title: '알림', msg: '[' + $(e.target).parents('ul').attr('nick') + ']님을 추방 하시겠습니까?' },
          function () {
            self.customSend({
              kick_user: {
                clientKey: $(e.target).parents('ul').attr('name'),
                nickName: use_list[$(e.target).parents('ul').attr('name')].nickName,
              },
            });
            // self.kickUser($(e.target).parents("ul").attr("name"));
          },
          function () {
            self.console.log('취소');
          }
        );
      } else {
        self.confirm_popup(
          { title: '알림', msg: '종료 하시겠습니까?' },
          function () {
            self.rtcLogout();
          },
          function () {
            self.console.log('취소');
          }
        );
      }
    });

    //
  }
  // 추방 이벤트
  // kickUser(clientKey) {
  //     channel.kickUser({ "clientKey": clientKey }, function(r, e) {
  //         setTimeout(function() { webrtc.allUserList(); }, 10);
  //     });
  // };

  // 커스텀 메시지 전송
  customSend(json, obj) {
    // self = this
    this.console.log(self, this);
    // self.console.log("customSend", json, (typeof json == 'object') ? JSON.stringify(json) : json);
    channel.sendCustom({
      message: typeof json == 'object' ? JSON.stringify(json) : json,
    });
  }
  // 토스트 팝업
  toastPopup(msg) {
    this.toastLayer.finish().fadeIn(this.fi).delay(this.de).fadeOut(this.fo).text(msg);
  }
  // 첫 진입시 마스터 확인
  marster_check(fn, e) {
    self = this;
    this.console.log(self, this);
    let users = Object.keys(channel.users).length >= Object.keys(use_list) ? Object.keys(channel.users) : Object.keys(use_list);
    self.console.debug('marster_check >>> ', users);
    if (users.length == 1) {
      marster = channel.clientKey;
      private_room.marster = true;
      private_room.share = false;
    } else {
      self.console.log('>>>>>>>>>', users.length);

      for (var i = 0; i < users.length; i++) {
        self.console.log('for문', users[i], use_list[users[i]]);

        if (use_list[users[i]] !== undefined && use_list[users[i]].marster) {
          marster = users[i];
          break;
        }
      }
      self.console.log(marster);
      // if (!marster) {
      //     marster = channel.clientKey
      //     private_room.marster = true;
      //     private_room.share = false;
      // }
      self.console.log(marster, private_room);
    }

    if (private_room.lock) {
      if (private_room.password) {
        if (private_room.roomPass) {
          private_room.roomPass = false;
          self.rtcStart();
        } else {
          self.privateRoom(private_room.password);
        }
      }
    } else {
      self.rtcStart();
    }

    fn(e);
  }
  // 마스터 확인
  re_marster_check(fn, e) {
    self = this;
    this.console.log(self, this);
    if (!channel) {
      return false;
    }
    let users = Object.keys(channel.users).length >= Object.keys(use_list) ? Object.keys(channel.users) : Object.keys(use_list);
    let __marster = undefined;
    self.console.debug('re_marster_check >>> ', users);
    if (users.length == 1) {
      marster = channel.clientKey;
      private_room.marster = true;
      private_room.share = false;
      self.marster_view(marster);
      self.customSend({
        marster_chg: {
          clientKey: channel.clientKey,
          nickName: channel.nickName,
          share: private_room.share,
        },
      });
    } else {
      for (var i = 0; i < users.length; i++) {
        // console.log("for문", users[i], use_list[users[i]])
        if (use_list[users[i]] !== undefined && use_list[users[i]].marster) {
          // if (marster == users[i]) {
          //     self.console.log("마스터는 유지");
          // } else {
          //     self.console.log("마스터가 변경됨");
          // }
          self.marster_view(users[i]);
          __marster = users[i];
          break;
        }
      }
      // self.console.log(marster, __marster)
      if (!__marster) {
        self.marster_view(channel.clientKey);
        marster = channel.clientKey;
      }
      // self.console.log(marster, private_room, __marster)
    }
    if (typeof fn === 'function') {
      fn(e);
    }
  }
  // 마스터로 변경시 뷰 고정
  marster_view(item, option) {
    // self = this
    this.console.log(self, this);
    // self.console.error(item)
    $('.present_cam > div').appendTo('.cam_list');
    $(`.cam_move[name="${item}"]`).appendTo('.present_cam');
  }
  // 비디오 태그 넣기
  videoInTag(event) {
    self = this;
    this.console.log(self, this);
    var re = false;
    let stream = event.target;
    // let html = $(`div[name="${event.clientKey}"]`, self.present_cam);
    let present_html = $('div.cam_move', self.present_cam_item);
    let video, html, nickName;
    html = $(self.video_html_tag).attr({ name: event.clientKey });
    if (event.clientKey == channel.clientKey) {
      if (event.client) {
        nickName = event.client.nickName + ' (나)';
      } else {
        nickName = '사용자 (나)';
      }
      $('.cam_user_name', html).css({ opacity: '0.8', 'font-weight': 'bolder' });
    } else {
      if (event.client) {
        nickName = event.client.nickName;
      } else {
        nickName = '사용자';
      }
    }
    if (present_html.length) {
      if ($(present_html).attr('name') == event.clientKey) {
        present_html.remove();
        re = true;
      }
    }
    for (var i = 0; i < $('.cam_move', self.cam_list_item).length; i++) {
      if ($($('.cam_move', self.cam_list_item).get(i)).attr('name') == event.clientKey) {
        $('.cam_move', self.cam_list_item).get(i).remove();
        re = true;
      }
    }
    if (marster == event.clientKey) {
      if (!present_html.length) {
        self.present_cam_item.prepend(html);
      } else {
        self.cam_list_item.append(html);
        self.marster_view();
      }
    } else {
      self.cam_list_item.append(html);
    }
    $('.cam_user_name', html).html(nickName);
    if (re) {
      self.re_marster_check();
    }

    video = $('video', html)[0];
    video.srcObject = stream;
    return video;
  }
  // 비디오 태그 삭제
  videoOutTag(event) {
    self = this;
    this.console.log(self, this);
    self.console.log('videoOutTag', event);

    let present_html = $(`div.cam_move[name="${event.clientKey}"]`, self.present_cam_item);
    let cam_list_html = $(`div.cam_move[name="${event.clientKey}"]`, self.cam_list_item);
    if (present_html.length) {
      present_html.remove();
    }
    if (cam_list_html.length) {
      cam_list_html.remove();
    }
  }
  // 오디오 체인지
  audioCng(event) {
    self = this;
    this.console.log(self, this);
    let html = $(`div.cam_move[name="${event.clientKey}"]`, self.video_area_item);
    let html2 = $(`div.user_list_wrap ul[name="${event.clientKey}"]`, self.pop_user_list);
    let is_mic = event.enable;
    self.console.log(html2, event);

    if ($('.mic_off', html)) {
      if (is_mic) {
        $('.mic_off', html).hide();
        if (html2.length) {
          try {
            use_list[event.clientKey].audio = true;
          } catch {
            self.customSend({ sendActiveUserList: '' });
          }
          $('li.ico_mic', html2).attr({ class: 'ico_mic on' });
        }
      } else {
        $('.mic_off', html).show();
        if (html2.length) {
          try {
            use_list[event.clientKey].audio = false;
          } catch {
            self.customSend({ sendActiveUserList: '' });
          }
          $('li.ico_mic', html2).attr({ class: 'ico_mic off' });
        }
      }
    }
  }
  // 비디오 체인지
  videoCng(event) {
    self = this;
    this.console.log(self, this);
    self.console.low_debug('>> videoCng: ', event);
    let html = $(`div.cam_move[name="${event.clientKey}"]`, self.video_area_item);
    let html2 = $(`div.user_list_wrap ul[name="${event.clientKey}"]`, self.pop_user_list);
    let is_cam = event.enable;
    self.console.log(html2, event);

    if ($('video', html)) {
      if (is_cam) {
        self.video_show($('video', html));
        if (html2.length) {
          try {
            use_list[event.clientKey].video = true;
          } catch {
            self.customSend({ sendActiveUserList: '' });
          }
          $('li.ico_camera', html2).attr({ class: 'ico_camera on' });
        }
      } else {
        self.video_hide($('video', html));
        if (html2.length) {
          try {
            use_list[event.clientKey].video = false;
          } catch {
            self.customSend({ sendActiveUserList: '' });
          }
          $('li.ico_camera', html2).attr({ class: 'ico_camera off' });
        }
      }
    }
  }
  // 채팅만 가능할경우 최소 네비 활성화
  s_footer_nav() {
    self = this;
    this.console.log(self, this);
    self.toastPopup('현재는 채팅만 가능한 상태입니다.');

    self.user_list_item.click(function (e) {
      self.allUserList();
      if (self.pop_user_list.is(':visible')) {
        self.pop_user_list.hide();
      } else {
        self.pop_user_list.show();
      }
    });

    self.chat_item.addClass('on');
    self.chat_wrap.attr({ class: 'chat_wrap active' });

    self.chatStart();
  }
  // 로그아웃
  rtcLogout() {
    self = this;
    this.console.log(self, this);
    var _present_cam = $('div.cam_move', self.present_cam_item);
    var _cam_list = $('div.cam_move', self.cam_list_item);
    for (var i = 0; i < _present_cam.length; i++) {
      _present_cam[i].remove();
    }
    for (var i = 0; i < _cam_list.length; i++) {
      _cam_list[i].remove();
    }

    vChatCloud.disconnect();
    self.footer_nav(false);
    setTimeout(function () {
      channel = undefined;
    }, 10);

    private_room = {};
    marster = undefined;
    use_list = {};
    all_users = {};
    present_mode = false;

    let login = self.login.show();
    $('input#name', login).val('');
    login.show();
    $('input', login).focus();
  }
  // 하단 네비게이션 활성화
  footer_nav(flag, retry) {
    self = this;
    this.console.log(self, this);
    if (retry) {
      self.lock_item.off();
      self.invite_item.off();
      self.presenter_item.off();
      self.mic_item.off();
      self.exit_item.off();
      self.camera_item.off();
      self.setting_item.off();
      self.present_item.off();
      self.user_list_item.off();
      self.chat_item.off();
      self.chat_help_on.off();
      self.chat_help_off.off();
    }
    if (flag) {
      // 회의실 잠금
      // self.lock_item.click(function (e) {
      //   console.log('lock??!?!?!?', private_room.marster, self.pop_lock.is(':visible'));
      //   if (private_room.marster) {
      //     // $(this).toggleClass("on off")
      //     if (self.pop_lock.is(':visible')) {
      //       self.pop_lock.removeClass('active');
      //     } else {
      //       var check_box = $('div.lock_btn label input[type=checkbox]', self.pop_lock);
      //       if (private_room.lock_stat) {
      //         if (!check_box.is(':checked')) {
      //           check_box.trigger('click');
      //         }
      //       } else {
      //         if (check_box.is(':checked')) {
      //           check_box.trigger('click');
      //         }
      //       }
      //       if (private_room.lock_pw) {
      //         $('div.copy_input input', self.pop_lock).val(private_room.lock_pw);
      //       } else {
      //         $('div.copy_input input', self.pop_lock).val('');
      //       }
      //       self.pop_lock.addClass('active');
      //     }
      //   } else {
      //     if (private_room.lock) {
      //       toastr.options = {
      //         positionClass: 'toast-top-left',
      //         progressBar: true,
      //         timeOut: 10000,
      //         onclick: function () {
      //           self.directClipboardCopy(private_room.password);
      //         },
      //       };
      //       // toastr.options.onclick = function() {
      //       //     self.directClipboardCopy(private_room.password);
      //       // };
      //       toastr.success('팝업 클릭시 클립보드 복사', '잠금안내');
      //     } else {
      //       toastr.options = {
      //         positionClass: 'toast-top-left',
      //         progressBar: true,
      //         timeOut: 5000,
      //       };
      //       toastr.success('발표자로 권한을 취득해 주세요.', '잠금안내');
      //     }
      //   }
      // });
      // 관리자 모드 > 적용하기 클릭 시
      $('button', self.pop_present_mode).click(function (e) {});
      // 초대하기
      self.invite_item.click(function (e) {
        if (self.pop_invite.is(':visible')) {
          self.pop_invite.hide();
        } else {
          self.pop_invite.show();
        }
      });
      self.invite_btn.click(function (e) {
        toastr.options = {
          positionClass: 'toast-top-left',
          closeButton: true,
          progressBar: true,
          timeOut: 10000,
        };
        var _target = $(e.target).siblings('input');
        var _arr = _target.val().split(',');
        for (var i = 0; i < _arr.length; i++) {
          var item = _arr[i].trim();
          if (self.checkEmail(item)) {
            var url = `${BASE_URL}/api/openapi/inviteWebRtc`;
            var param = {
              room_id: channel.roomId,
              to_email: item,
              url: window.location.href,
            };
            $.post(
              url,
              param,
              function (data) {
                if (data.result_cd != 1) {
                  toastr.error(data.reuslt_msg, '메일전송 실패 (' + data.result_cd + ')');
                } else {
                  toastr.success('[ ' + item + ' ] 으로 메일을 전송하였습니다.', '메일 알림');
                }
              },
              'json'
            );
          } else {
            toastr.warning('[ ' + item + ' ] 메일 주소를 확인해주세요.', '메일 형식오류');
            self.console.log(item);
          }
        }
        self.toastPopup('메일 전송을 요청하였습니다.');
        self.pop_invite.hide();
        _target.val('');
      });
      // 발표자 권한 선택
      self.presenter_item.click(function (e) {
        if (self.pop_present_mode.hasClass('active')) {
        } else {
          if (private_room.marster) {
            if (!$('.present_btn label input[type=checkbox]').is(':checked')) {
              $('.present_btn label input[type=checkbox]').trigger('click');
            }
          } else {
            if ($('.present_btn label input[type=checkbox]').is(':checked')) {
              $('.present_btn label input[type=checkbox]').trigger('click');
            }
          }
          if (private_room.share) {
            if (!$('.present_view_btn label input[type=checkbox]').is(':checked')) {
              $('.present_view_btn label input[type=checkbox]').trigger('click');
            }
          } else {
            if ($('.present_view_btn label input[type=checkbox]').is(':checked')) {
              $('.present_view_btn label input[type=checkbox]').trigger('click');
            }
          }
        }
        self.pop_present_mode.toggleClass('active');
      });
      // 관리자 모드 적용
      $('button', self.pop_present_mode).click(function (e) {
        private_room.share = $('.present_view_btn label input[type=checkbox]').is(':checked');
        private_room.marster = $('.present_btn label input[type=checkbox]').is(':checked');
        // 회의실 잠금
        private_room.lock_stat = $('.lock_btn input[type=checkbox]').is(':checked');
        if (private_room.lock_stat) {
          private_room.lock_pw = $('.lock_password .copy_input input[type=text]').val();
          if (private_room.lock_pw == '') {
            private_room.lock_pw = self.create_password();
            $('.lock_password .copy_input input[type=text]').val(private_room.lock_pw);
          }
        } else {
          private_room.lock_pw = undefined;
        }
        // console.error(private_room.lock_stat);
        if (private_room.lock_stat === true) {
          self.lock_item.attr({ class: 'room_lock' });
        } else {
          self.lock_item.attr({ class: 'room_unlock' });
        }
        self.pop_lock.removeClass('active');
        self.customSend({
          lock: {
            lock_stat: private_room.lock_stat,
            lock_pw: private_room.lock_pw,
          },
        });
        self.pop_present_mode.removeClass('active');
      });

      // 자신 마이크
      self.mic_item.click(function (e) {
        self.mic.toggle($(e.currentTarget).hasClass('off'));
      });
      // 자신 로그아웃
      self.exit_item.click(function (e) {
        self.confirm_popup(
          { title: '알림', msg: '종료 하시겠습니까?' },
          function () {
            self.rtcLogout();
            fabricWrapper.hide();
            fileHelper.hide();
          },
          function () {
            self.console.log('취소');
          }
        );
      });
      // 자신 카메라
      self.camera_item.click(function (e) {
        self.cam.toggle($(e.currentTarget).hasClass('off'));
      });
      // 설정 아이콘 클릭
      self.setting_item.click(function (e) {
        self.pop_setmenu_wrap.toggleClass('active');
      });
      // 음성 설정 클릭
      self.voice_setting.click(voiceSettingInit);
      // 영상 설정 클릭
      self.video_setting.click(videoSettingInit);
      // 배경 설정 클릭
      self.background_setting.click(backgroundSettingInit);

      // 화면 공유하기 버튼 클릭
      self.present_item.click(function (e) {
        if (channel) {
          if (private_room.share_lock) {
            self.toastPopup('현재 발표자만 가능합니다.');
          } else {
            self.pop_screen_share.toggleClass('active');
          }
        } else {
          self.toastPopup('로그인을 해주세요');
        }
      });
      // 내 화면 공유 클릭
      self.screen_share.click(function (e) {
        channel.toggleRTCMedia(function (name, suss) {
          if (suss) {
            if ('share' === name) {
              fabricWrapper.hide();
              fileHelper.hide();
              self.screen_share.addClass('on');
              self.screen_share.removeClass('off');
              self.pop_screen_share.removeClass('active');
              present_mode = true;
            } else if ('media' === name) {
              self.screen_share.addClass('off');
              self.screen_share.removeClass('on');
              self.pop_screen_share.removeClass('active');
              present_mode = false;
            }
          }
        });
      });
      // // 파일 공유 클릭
      // self.file_share.click(function (e) {
      //   if (present_mode === true) {
      //     channel.toggleRTCMedia();
      //     present_mode = false;
      //   }
      //   fabricWrapper.hide();
      //   fileHelper.show();
      // });
      // // 화이트 보드 클릭
      // self.white_board.click(function (e) {
      //   if (present_mode === true) {
      //     channel.toggleRTCMedia();
      //     present_mode = false;
      //   }
      //   fabricWrapper.show();
      //   fileHelper.hide();
      // });
      // 참여자 목록
      self.user_list_item.click(function (e) {
        if (self.pop_user_list.is(':visible')) {
          self.pop_user_list.hide();
        } else {
          self.pop_user_list.show();
        }
      });
      // 채팅
      self.chat_item.click(function () {
        $(this).toggleClass('on off');
        if ($(this).hasClass('on')) {
          self.chat_wrap.attr({ class: 'chat_wrap active' });
        } else {
          self.chat_wrap.attr({ class: 'chat_wrap' });
          self.chat_help_wrap.attr({ class: 'chat_help_wrap' });
        }
      });
      // 채팅 헬프 on/off
      self.chat_help_on.click(function () {
        self.chat_help_wrap.attr({ class: 'chat_help_wrap active' });
      });
      self.chat_help_off.click(function () {
        self.chat_help_wrap.attr({ class: 'chat_help_wrap' });
      });
    } else {
      // navi01
      self.lock_item.attr({ class: 'footer_navi_ico ico_lock off' }).off();
      self.pop_lock.removeClass('active').off();
      self.invite_item.off();
      self.pop_invite.hide();
      self.presenter_item.attr({ class: 'footer_navi_ico ico_presenter off' }).off();
      // navi03
      self.mic_item.attr({ class: 'footer_navi_ico ico_mic on' }).off();
      self.exit_item.off();
      self.camera_item.attr({ class: 'footer_navi_ico ico_camera on' }).off();
      self.setting_item.off();
      self.pop_setmenu_wrap.removeClass('active').off();
      self.voice_setting.off();
      self.video_setting.off();
      self.background_setting.off();
      // navi02
      self.present_item.off();
      self.screen_share.off();
      self.pop_screen_share.removeClass('active').off();
      self.pop_present_mode.removeClass('active').off();
      self.user_list_item.off();
      self.pop_user_list.hide();
      self.chat_help_on.off();
      self.chat_help_off.off();
      self.chat_item.attr({ class: 'footer_navi_ico ico_chat off' }).off();
      self.chat_wrap.attr({ class: 'chat_wrap' });
      // setting window
      self.popup_setting_dim.css('visiblity', 'hidden').off();
      self.setting_window.voice.wrap.removeClass('active').off();
      self.setting_window.voice.save.off();
      self.setting_window.voice.reset.off();
      self.setting_window.voice.close.off();
      self.setting_window.video.wrap.removeClass('active').off();
      self.setting_window.video.save.off();
      self.setting_window.video.reset.off();
      self.setting_window.video.close.off();
      self.setting_window.background.wrap.removeClass('active').off();
      self.setting_window.background.save.off();
      self.setting_window.background.reset.off();
      self.setting_window.background.close.off();
    }
  }

  // 개인 카메라 컨트롤
  cam = {
    toggle: function (flag, fn) {
      if (flag) {
        if (present_mode) {
          webrtc.toastPopup('발표를 종료후 카메라를 on 해주세요');
        } else {
          this.on(fn);
        }
      } else {
        if (present_mode) {
          webrtc.toastPopup('발표를 종료후 카메라를 off 해주세요');
        } else {
          this.off(fn);
        }
      }
    },
    on: function (fn) {
      let flag = false;
      if (channel) {
        flag = true;
      }
      if (typeof fn === 'function') {
        fn(flag);
      } else {
        if (flag) {
          if (param.video.previewModal === true) {
            videoSettingInit();
          } else {
            channel.toggleRTCVideoControl(true);
            webrtc.toastPopup('카메라가 켜졌습니다.');
          }
        } else {
          webrtc.toastPopup('로그인을 진행해 주세요.');
        }
        return true;
      }
    },
    off: function (fn) {
      let flag = false;
      if (channel) {
        flag = true;
      }
      if (typeof fn === 'function') {
        fn(flag);
      } else {
        if (flag) {
          channel.toggleRTCVideoControl(false);
          webrtc.toastPopup('카메라가 꺼졌습니다.');
        } else {
          webrtc.toastPopup('로그인을 진행해 주세요.');
        }
        return true;
      }
    },
  };
  // 개인 마이크 컨트롤
  mic = {
    toggle: function (flag, fn) {
      if (flag) {
        this.on(fn);
      } else {
        this.off(fn);
      }
    },
    on: function (fn) {
      let flag = false;
      if (channel) {
        flag = true;
      }
      if (typeof fn === 'function') {
        fn(flag);
      } else {
        if (flag) {
          channel.toggleRTCAudioControl(true);
          webrtc.toastPopup('마이크가 켜졌습니다.');
        } else {
          webrtc.toastPopup('로그인을 진행해 주세요.');
        }
        return true;
      }
    },
    off: function (fn) {
      let flag = false;
      if (channel) {
        flag = true;
      }
      if (typeof fn === 'function') {
        fn(flag);
      } else {
        if (flag) {
          channel.toggleRTCAudioControl(false);
          webrtc.toastPopup('마이크가 꺼졌습니다.');
        } else {
          webrtc.toastPopup('로그인을 진행해 주세요.');
        }
        return true;
      }
    },
  };
  // 비디오 화면 컨트롤
  video_show(item) {
    $(item).css({ visibility: 'visible' });
  }
  video_hide(item) {
    $(item).css({ visibility: 'hidden' });
  }
}
