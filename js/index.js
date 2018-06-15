/*LOADING*/
let loadingRender = (function () {
    let $loadingBox = $('.loadingBox'),
        $run = $loadingBox.find('.run');

    let imgList = ["myAddress.png", "phoneBg.jpg"];
    //=> 控制图片加载进度，计算滚动条长度 Control the progress of the picture loading and calculate the length of the scroll bar
    let total = imgList.length,
        cur = 0;
    let computed = function () {
        imgList.forEach(function (item) {
            let tempImg = new Image;
            tempImg.src = 'img/' + item;
            tempImg.onload = function () {
                cur++;
                tempImg = null;
                runFn(cur);
            };

        });
    };

    //=>计算滚动条加载长度
    let runFn = function (cur) {
        $run.css('width', cur / total * 100 + '%');
        if (cur >= total) {
            //=>图片都加载完成了，进入到下一个区域
            let delayTimer = setTimeout(() => {
                $loadingBox.remove();
                phoneRender.init();
                clearInterval(delayTimer);
            }, 1500);
        }
    };


    return {
        init: function () {
            $loadingBox.css('display', 'block'); //=>我们在CSS中吧所有区域的display都先设置为none，开发哪个区域就执行哪个方法的init方法，在这个方法当中首先控制当前区域展示（开发哪个区域，哪个区域就展示，其他区域都是隐藏的）
            computed();
        }
    }
})();

/*PHONE INTERFACE*/
let phoneRender = (function ($) {
    let $phoneBox = $('.phoneBox'),
        $time = $phoneBox.find('.time'),
        $listen = $phoneBox.find('.listen'),
        $listenTouch = $listen.find('.touch'),
        $detail = $phoneBox.find('.detail'),
        $detailTouch = $detail.find('.touch');

    let audioBell = $('#audioBell')[0],
        audioTKU = $('#audioTKU')[0];

    let $phonePlan = $.Callbacks();
    //=>control listen bar show or hide
    $phonePlan.add(function () {
        $listen.remove();
        $detail.css('transform', 'translateY(0)');
    });

    //=>control TKU play
    $phonePlan.add(function () {
        audioBell.pause();
        audioTKU.play();
        $time.css('display', 'block');

        //=>计算时间
        let sayTime = setInterval(function () {
            //=> 获取总时间&&已经播放时间（s）
            let current = audioTKU.currentTime;

            let minute = Math.floor(current / 60),
                second = Math.floor(current - minute * 60);

            minute < 10 ? minute = '0' + minute : null;
            second < 10 ? second = '0' + second : null;
            $time.html(`${minute}:${second}`);

            //=>播放结束
            if (current >= audioTKU.duration) {
                clearInterval(sayTime);
                enterNext();
            }
        }, 1000);
    });

    //=>detail-touch
    $phonePlan.add(function () {
        $detailTouch.tap(enterNext);
    });

    //=>进入下一个区域（message）
    let enterNext = function () {
        audioTKU.pause();
        $phoneBox.remove();
        messageRender.init();
    };

    return {
        init: function () {
            $phoneBox.css('display', 'block');
            //=> bell play
            audioBell.play();
            //=> listen-touch
            $listenTouch.tap($phonePlan.fire);
        }
    }
})(Zepto);

/*--MESSAGE--*/
let messageRender = (function ($) {
    let $messageBox = $('.messageBox'),
        $talkBox = $messageBox.find('.talkBox'),
        $talkList = $messageBox.find('li'),
        $keyBoard = $messageBox.find('.keyboard'),
        $keyBoardText = $keyBoard.find('span'),
        $submit = $keyBoard.find('.submit'),
        musicAudio = $messageBox.find('#musicAudio')[0];

    let $plan = $.Callbacks();

    //=>控制消息列表逐条显示
    let step = -1,
        autoTimer = null,
        interval = 1500,
        offset = 0;
    $plan.add(() => {
        autoTimer = setInterval(() => {
            step++;
            let $cur = $talkList.eq(step);
            $cur.css({
                opacity: 1,
                transform: 'translateY(0)'
            });
            //=>第三条完全显示后立即调取出键盘（STEP === 2）
            if (step === 2) {
                //=> transitionend:当前元素正在运行的css3过渡动画完成，就会触发这个事件（有几个样式需要改变，就会被触发执行几次）
                //=> one是jq中事件绑定方法，主要想要实现当前事件只绑定一次，触发一次后事件自动移除
                $cur.one('transitionend', () => {
                    $keyBoard.css('transform', 'translateY(0)')
                        .one('transitionend', textMove);
                });
                clearInterval(autoTimer);
            }

            //=>从第五条开始，每当展示一个LI，都需要让UL整体上移
            if (step >= 4) {
                offset += $cur[0].offsetHeight;
                $talkBox.css(`transform`, `translateY(${-offset}px)`);
            }

            if (step >= $talkList.length - 1) {
                clearInterval(autoTimer);

                //=> 进入下一个环节之前给设置一个延迟，
                // 让用户把最后一条数据读完整
                let delayTimer = setTimeout(function () {
                    musicAudio.pause();
                    $messageBox.remove();
                    cube.init();
                    clearTimeout(delayTimer);
                }, interval);
                return;
            }
        }, interval);

    });

    //=>控制文字及其打印机效果
    let textMove = function () {
        let text = $keyBoardText.html();
        $keyBoardText.css('display', 'block').html('');

        let timer = null,
            n = -1;
        timer = setInterval(() => {
            n++;
            $keyBoardText[0].innerHTML += text[n];
            if (n === text.length - 1) {
                //=>打印机效果完成：让发送按钮显示
                clearInterval(timer);
                $submit.css('display', 'block').tap(() => {
                    $keyBoardText.css('display', 'none');
                    $keyBoard.css('transform', 'translateY(4.8rem)');

                    $plan.fire();//=>此时队列中只有一个方法，继续执行让消息继续弹出
                });

                return;
            }
        }, 300);
    };


    return {
        init: function () {
            $messageBox.css('display', 'block');
            musicAudio.play();
            $plan.fire();
        }
    }
})(Zepto);

/*--CUBE--*/
let preDf = function (e) {
    e.preventDefault();
};
$(document).on('touchstart touchmove touchend', preDf);
let cube = (function () {
    let $cubeBox = $('.cubeBox'),
        $box = $cubeBox.find('.box');

    let touchBegin = function (e) {
        //=>this:box
        let point = e.changedTouches[0];
        $(this).attr({
            strX: point.clientX,
            strY: point.clientY,
            isMove: false,
            changeX: 0,
            changeY: 0
        });
    };

    let touching = function (e) {
        let point = e.changedTouches[0],
            $this = $(this);
        let changeX = point.clientX - parseFloat($this.attr('strX')),
            changeY = point.clientY - parseFloat($this.attr('strY'));

        if (Math.abs(changeX) > 10 || Math.abs(changeY > 10)) {
            $this.attr({
                isMove: true,
                changeX: changeX,
                changeY: changeY
            });
        }
    };

    let touchEnd = function (e) {
        let point = e.changedTouches[0],
            $this = $(this);
        let isMove = $this.attr('isMove'),
            changeX = parseFloat($this.attr('changeX')),
            changeY = parseFloat($this.attr('changeY')),
            rotateX = parseFloat($this.attr('rotateX')),
            rotateY = parseFloat($this.attr('rotateY'));
        if (isMove === 'false') return;
        rotateX = rotateX - changeY / 2;
        rotateY = rotateY + changeX / 2;
        $this.css(`transform`, `scale(.6) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`).attr({
            rotateX: rotateX,
            rotateY: rotateY
        });
    };

    return {
        init: function () {
            $cubeBox.css('display', 'block');
            $box.attr({
                rotateX: -20,
                rotateY: 45
            }).on({
                touchstart: touchBegin,
                touchmove: touching,
                touchend: touchEnd
            });

            //=>给每一个页面的点击操作
            $box.find('li').tap(function () {
                $cubeBox.css('display', 'none');
                let index = $(this).index();
                detailRender.init(index);
            });
        }
    }
})();

let detailRender = (function () {
    let $detailBox = $('.detailBox'),
        $cubeBox = $('.cubeBox'),
        $returnLink = $detailBox.find('.returnLink'),
        swiperExample = null;
    let $makisuBox = jQuery('#makisuBox');

    let change = function (example) {
        //example.activeIndex //=> 当前活动块的索引
        //example.slides //=>数组，存储了当前所有活动块
        //example.slides[example.activeIndex] //=>当前活动块

        let {slides: slideAry, activeIndex} = example;

        //=> PAGE1单独处理
        if (activeIndex === 0) {
            $makisuBox.makisu({
                selector: 'dd',
                overlap: 0.4,
                speed: 0.6
            });
            $makisuBox.makisu('open');
        } else {
            $makisuBox.makisu({
                selector: 'dd',
                overlap: 0,
                speed: 0
            });
            $makisuBox.makisu('close');
        }

        //=>给当前活动块设置ID，其他块移除ID
        [].forEach.call(slideAry, (item, index) => {
            if (index === activeIndex) {
                item.id = 'page' + (activeIndex + 1);
                return;
            }
            item.id = null;
        });
    };

    return {
        init: function (index = 0) {
            $detailBox.css('display', 'block');
            //=>init swiper
            if (!swiperExample) {
                //=>return
                $returnLink.tap(() => {
                    $detailBox.css('display', 'none');
                    $cubeBox.css('display', 'block');
                });

                //=> 不存在实例的情况下我们初始化，如果初始化过了，下一次直接运动到具体位置即可，不需要重新的初始化
                swiperExample = new Swiper('.swiper-container', {
                    // loop:true, //=>如果我们采用的切换效果是3D的，最好不要设置无缝衔接循环切换，在部分安卓机中，SWIPER这块的处理是有一些BUG的
                    effect: 'coverflow',
                    onInit: change,
                    onTransitionEnd: change
                });
            }

            index = index > 5 ? 5 : index;
            swiperExample.slideTo(index, 0); //=>运动到指定索引的SLIDE位置，第二个参数是speed，我们设置0是让其立即运动到指定位置;
        }
    }
})();

loadingRender.init();

