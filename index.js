/**
 * Created by Riven on 2018/5/27.
 */

const ArgumentType = Scratch.ArgumentType;
const BlockType = Scratch.BlockType;
const formatMessage = Scratch.formatMessage;
const log = Scratch.log;


const isNumber = n => {
    n = n.replace(/'/g, '')
    return !isNaN(parseFloat(n)) && isFinite(n);
};

class TelloExtension {
    constructor (runtime){
        this.runtime = runtime;
        this.comm = runtime.ioDevices.comm;
        this.session = null;
        this.runtime.registerPeripheralExtension('Tello', this);
        // session callbacks
        this.onmessage = this.onmessage.bind(this);
        this.onclose = this.onclose.bind(this);

        this.decoder = new TextDecoder();
        this.lineBuffer = '';
        this.hostIP = '192.168.10.1';
        this.hostPort = 8889;
        this.rxport = 12345;

        // Local Debugging
        // this.hostIP = '127.0.0.1';
        // this.hostPort = 8890;
    }

    write (data){
        // if (!data.endsWith('\n')) data += '\n';
        if (this.session) this.session.write(data);
    }

    report (data){
        return new Promise(resolve => {
            this.write(data);
            this.reporter = resolve;
        });
    }


    onmessage (data){
        const dataStr = this.decoder.decode(data);
        this.lineBuffer += dataStr;
        if (this.lineBuffer.indexOf('\n') !== -1){
            const lines = this.lineBuffer.split('\n');
            this.lineBuffer = lines.pop();
            for (const l of lines){
                console.log("Tello >>", l);
                if (this.reporter) this.reporter(l);
            }
        }
    }

    onclose (error){
        log.warn('on close', error);
        this.session = null;
        this.runtime.emit(this.runtime.constructor.PERIPHERAL_ERROR);
    }

    // method required by vm runtime
    scan (){
        this.comm.ping(this.hostIP).then(result => {
            this.runtime.emit(this.runtime.constructor.PERIPHERAL_LIST_UPDATE, result);
        });
    }

    connect (id){
        this.comm.connectUDP(id, this.hostIP, this.hostPort, this.rxport).then(sess => {
            this.session = sess;
            this.session.onmessage = this.onmessage;
            this.session.onclose = this.onclose;
            // notify gui connected
            this.runtime.emit(this.runtime.constructor.PERIPHERAL_CONNECTED);
        }).catch(err => {
            log.warn('connect peripheral fail', err);
        });
    }

    disconnect (){
        this.session.close();
    }

    isConnected (){
        return Boolean(this.session);
    }

    getInfo (){

        return {
            id: 'Tello',

            name: 'Tello',
            color1: '#FFA500',
            color2: '#FFA500',
            color3: '#EB8700',
            menuIconURI: 'data:image/png;base64,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',
            blockIconURI: 'data:image/png;base64,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',
            showStatusButton: true,

            blocks: [
                {
                    opcode: 'command',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Tello.command',
                        default: 'Arm Flight'
                    }),
                    func: 'command'
                },
                {
                    opcode: 'takeOff',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Tello.takeOff',
                        default: 'Take Off'
                    }),
                    func: 'takeOff'
                },
                {
                    opcode: 'land',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Tello.land',
                        default: 'Land'
                    }),
                    func: 'land'
                },
                {
                    opcode: 'flyUp',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Tello.flyUp',
                        default: 'Up [LEN]'
                    }),
                    arguments: {
                        LEN: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 20
                        }
                    },
                    func: 'flyUp'
                },
                {
                    opcode: 'flyDown',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Tello.flyDown',
                        default: 'Down [LEN]'
                    }),
                    arguments: {
                        LEN: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 20
                        }
                    },
                    func: 'flyDown'
                },
                {
                    opcode: 'flyFw',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Tello.flyFw',
                        default: 'Forward [LEN]'
                    }),
                    arguments: {
                        LEN: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 20
                        }
                    },
                    func: 'flyFw'
                },
                {
                    opcode: 'flyBack',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Tello.flyBack',
                        default: 'Back [LEN]'
                    }),
                    arguments: {
                        LEN: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 20
                        }
                    },
                    func: 'flyBack'
                },
                {
                    opcode: 'flyLeft',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Tello.flyLeft',
                        default: 'Left [LEN]'
                    }),
                    arguments: {
                        LEN: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 20
                        }
                    },
                    func: 'flyLeft'
                },
                {
                    opcode: 'flyRight',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Tello.flyRight',
                        default: 'Right [LEN]'
                    }),
                    arguments: {
                        LEN: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 20
                        }
                    },
                    func: 'flyRight'
                },
                {
                    opcode: 'rollCw',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Tello.rollCw',
                        default: 'Roll Cw [LEN]'
                    }),
                    arguments: {
                        LEN: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 90
                        }
                    },
                    func: 'rollCw'
                },
                {
                    opcode: 'rollCcw',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Tello.rollCcw',
                        default: 'Roll CCW [LEN]'
                    }),
                    arguments: {
                        LEN: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 90
                        }
                    },
                    func: 'rollCcw'
                },
                {
                    opcode: 'setSpeed',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Tello.setSpeed',
                        default: 'Speed [LEN]'
                    }),
                    arguments: {
                        LEN: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 20
                        }
                    },
                    func: 'setSpeed'
                },
                {
                    opcode: 'flip',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Tello.flip',
                        default: 'Flip [TAKEPUT]'
                    }),
                    arguments: {
                        TAKEPUT: {
                            type: ArgumentType.STRING,
                            defaultValue: 'forward',
                            menu: 'takeput'
                        }
                    },
                    func: 'flip'
                },
                {
                    opcode: 'flyGo',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Tello.flyGo',
                        default: 'Go X:[X] Y:[Y] Z:[Z] Speed:[SPEED]'
                    }),
                    arguments: {
                        X: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                        Y: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                        Z: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                        SPEED: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                    },
                    func: 'flyGo'
                },
                {
                    opcode: 'flyStop',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Tello.flyStop',
                        default: 'STOP!'
                    }),
                    func: 'flyStop'
                },
                // MissionPad 挑战卡
                {
                    opcode: 'mpadOn',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Tello.mpadOn',
                        default: 'MissionPad On'
                    }),
                    func: 'mpadOn'
                },
                {
                    opcode: 'mpadOff',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Tello.mpadOff',
                        default: 'MissionPad Off'
                    }),
                    func: 'mpadOff'
                },
                {
                    opcode: 'mpadDirection',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Tello.mpadDirection',
                        default: 'MissionPad Direction [VIEW]'
                    }),
                    arguments: {
                        VIEW: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Overview',
                            menu: 'mdirections'
                        }
                    },
                    func: 'mpadDirection'
                },
                {
                    opcode: 'mpadGo',
                    blockType: BlockType.COMMAND,

                    text: formatMessage({
                        id: 'Tello.mpadGo',
                        default: 'Go X:[X] Y:[Y] Z:[Z] Speed:[SPEED] MID:[MID]'
                    }),
                    arguments: {
                        X: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                        Y: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                        Z: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                        SPEED: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                        MID: {
                            type: ArgumentType.STRING,
                            defaultValue: 'm1',
                            menu: 'mpads'
                        }
                    },
                    func: 'mpadGo'
                },
                // Read Command 读取命令
                {
                    opcode: 'getBattery',
                    blockType: BlockType.REPORTER,

                    text: formatMessage({
                        id: 'Tello.getBattery',
                        default: 'Battery?'
                    }),
                    func: 'getBattery'
                },
                {
                    opcode: 'getSpeed',
                    blockType: BlockType.REPORTER,

                    text: formatMessage({
                        id: 'Tello.getSpeed',
                        default: 'Motor Speed?'
                    }),
                    func: 'getSpeed'
                },
                {
                    opcode: 'getTime',
                    blockType: BlockType.REPORTER,

                    text: formatMessage({
                        id: 'Tello.getTime',
                        default: 'Motor RunTime?'
                    }),
                    func: 'getTime'
                },
                {
                    opcode: 'getWifi',
                    blockType: BlockType.REPORTER,

                    text: formatMessage({
                        id: 'Tello.getWifi',
                        default: 'Wifi SNR?'
                    }),
                    func: 'getWifi'
                },
            ],
            menus: {
                takeput: ['forward', 'back', 'left','right'],
                mdirections: ['Overview', 'Frontview', 'Both'],
                mpads: ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm-1', 'm-2']
            },
            translation_map: {
                'zh-cn': {
                    command: '控制 Tello',
                    flyDown: '下降 [LEN]',
                    flip: '翻滚 [TAKEPUT]',
                    takeput: {
                        forward: '前翻',
                        back: '后翻',
                        left: '左翻',
                        right: '右翻'
                    },
                    flyGo: 'Go X:[X] Y:[Y] Z:[Z] 速度:[SPEED]',
                    flyStop: '停止运动（悬停）',
                    getBattery: '电量',
                    getSpeed: '电机速度',
                    getTime:'电机运转时间',
                    getWifi: 'WiFi 信噪比',
                    mpadOn: '打开 挑战卡探测',
                    mpadOff: '关闭 挑战卡探测',
                    mpadDirection: '探测视角 [VIEW]',
                    mdirections: {
                        Overview: '下视探测',
                        Frontview: '前视探测',
                        Both: '同时打开',
                    },
                    mpadGo: 'Go X:[X] Y:[Y] Z:[Z] 速度:[SPEED] 挑战卡ID:[MID]',
                    mpads: {
                        'm-1': '最快识别的挑战卡',
                        'm-2': '最近的挑战卡'
                    }
                }
            }
        };
    }

    noop (){

    }
    flip (args){
        let param = 'f';
        if (args.TAKEPUT === 'forward') {
            param = 'f';
        }
        else if (args.TAKEPUT === 'back') {
            param = 'b';
        }
        else if (args.TAKEPUT === 'left') {
            param = 'l';
        }
        else {
            param = 'r';
        }
        const cmd = `flip ${param}`;
        this.write(cmd);
    }

    command (args){
        const cmd = 'command';
        this.write(cmd);
    }

    takeOff (args){
        const cmd = 'takeoff';
        this.write(cmd);
    }

    land (args){
        const cmd = 'land';
        this.write(cmd);
    }

    flyUp (args){
        const cmd = `up ${args.LEN}`;
        this.write(cmd);
    }

    flyDown (args){
        const cmd = `down ${args.LEN}`;
        this.write(cmd);
    }

    flyFw (args){
        const cmd = `forward ${args.LEN}`;
        this.write(cmd);
    }

    flyBack (args){
        const cmd = `back ${args.LEN}`;
        this.write(cmd);
    }

    flyLeft (args){
        const cmd = `left ${args.LEN}`;
        this.write(cmd);
    }

    flyRight (args){
        const cmd = `right ${args.LEN}`;
        this.write(cmd);
    }

    rollCw (args){
        const cmd = `cw ${args.LEN}`;
        this.write(cmd);
    }

    rollCcw (args){
        const cmd = `ccw ${args.LEN}`;
        this.write(cmd);
    }

    setSpeed (args){
        const cmd = `speed ${args.LEN}`;
        this.write(cmd);
    }

    flyGo (args){
        const cmd = `go ${args.X} ${args.Y} ${args.Z} ${args.SPEED}`;
        this.write(cmd);
    }

    flyStop (args){
        const cmd = `stop`;
        this.write(cmd);
    }

    // 挑战卡
    mpadOn (args){
        const cmd = `mon`;
        this.write(cmd);
        return this.report(cmd).then(ret => this.parseCmd(ret));
    }

    mpadOff (args){
        const cmd = `moff`;
        this.write(cmd);
        return this.report(cmd).then(ret => this.parseCmd(ret));
    }

    mpadDirection (args){
        let param = '0';
        if (args.VIEW === 'Overview') {
            param = '0';
        }
        else if (args.VIEW === 'Frontview') {
            param = '1';
        }
        else {
            param = '2';
        }
        const cmd = `mdirection ${param}`;
        this.write(cmd);
    }

    mpadGo (args){
        const cmd = `go ${args.X} ${args.Y} ${args.Z} ${args.SPEED} ${args.MID}`;
        this.write(cmd);
    }

    getBattery (args){
        const cmd = 'battery?';
        return this.report(cmd).then(ret => this.parseCmd(ret));
    }

    getSpeed (args){
        const cmd = 'speed?';
        return this.report(cmd).then(ret => this.parseCmd(ret));
    }

    getTime (args){
        const cmd = 'time?';
        return this.report(cmd).then(ret => this.parseCmd(ret));
    }

    getWifi (args){
        const cmd = 'wifi?';
        return this.report(cmd).then(ret => this.parseCmd(ret));
    }

    parseCmd (msg){
        msg = msg.toString();
        if (isNumber(msg)){
            return parseInt(msg, 10);
        } else {
            return msg;
        }
    }
}

module.exports = TelloExtension;
