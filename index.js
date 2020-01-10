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
            color1: '#5b8c00',
            color2: '#3f6600',
            color3: '#254000',
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
