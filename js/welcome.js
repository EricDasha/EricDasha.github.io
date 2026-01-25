// IP 地理位置欢迎信息 - 智能缓存版
// 特性：
// 1. 智能缓存：IP 变化时才重新请求 API
// 2. IPv6 特殊处理：显示"先进的技术"
// 3. IPv4 检测失败：显示"?"
// 4. 多 API 备用：ip-api.com 被墙时有备选

const CACHE_KEY = 'welcome_ip_cache';
let ipLocation = null;

// 判断是否为 IPv6 地址
function isIPv6(ip) {
    return ip && ip.includes(':');
}

// 判断是否为 IPv4 地址
function isIPv4(ip) {
    return ip && /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip);
}

// 获取缓存数据
function getCache() {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        return cached ? JSON.parse(cached) : null;
    } catch (e) {
        return null;
    }
}

// 保存缓存数据
function setCache(data) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
            ...data,
            timestamp: Date.now()
        }));
    } catch (e) {
        console.log('缓存写入失败');
    }
}

// 先获取当前 IP，再决定是否需要查询归属地
async function fetchIPLocation() {
    // 检测本地环境
    const isLocalhost = window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.startsWith('192.168.');

    if (isLocalhost) {
        ipLocation = {
            country: '本地预览',
            regionName: '开发环境',
            city: 'Localhost',
            lat: 0,
            lon: 0,
            query: '127.0.0.1',
            isLocalPreview: true
        };
        showWelcome();
        return;
    }

    try {
        // 步骤1：先获取当前 IP（使用 ipify，支持 IPv4/IPv6 检测）
        // 备选 API：https://api64.ipify.org（支持 IPv6）
        const ipResponse = await fetch('https://api64.ipify.org?format=json');
        const ipData = await ipResponse.json();
        const currentIP = ipData.ip;

        // 步骤2：检查缓存中的 IP 是否一致
        const cached = getCache();
        if (cached && cached.query === currentIP) {
            // IP 没变，直接使用缓存
            ipLocation = cached;
            showWelcome();
            return;
        }

        // 步骤3：IP 变化或无缓存，需要查询归属地
        // IPv6 地址特殊处理
        if (isIPv6(currentIP)) {
            ipLocation = {
                country: 'IPv6 网络',
                regionName: '',
                city: '',
                lat: 0,
                lon: 0,
                query: currentIP,
                isIPv6: true
            };
            setCache(ipLocation);
            showWelcome();
            return;
        }

        // IPv4：查询归属地
        // 主 API：ip-api.com（注意：在中国大陆可能被墙）
        // 备选：使用 https://ipwho.is（较稳定）
        try {
            const geoResponse = await fetch(`https://ip-api.com/json/${currentIP}?lang=zh-CN&fields=status,country,regionName,city,lat,lon,query`);
            const geoData = await geoResponse.json();

            if (geoData.status === 'success') {
                ipLocation = geoData;
                setCache(ipLocation);
                showWelcome();
                return;
            }
        } catch (e) {
            console.log('ip-api.com 请求失败，尝试备用 API');
        }

        // 备用 API：ipwho.is（更稳定，不太容易被墙）
        try {
            const backupResponse = await fetch(`https://ipwho.is/${currentIP}?lang=zh`);
            const backupData = await backupResponse.json();

            if (backupData.success) {
                ipLocation = {
                    country: backupData.country,
                    regionName: backupData.region,
                    city: backupData.city,
                    lat: backupData.latitude,
                    lon: backupData.longitude,
                    query: currentIP
                };
                setCache(ipLocation);
                showWelcome();
                return;
            }
        } catch (e) {
            console.log('备用 API 也失败');
        }

        // 所有 API 都失败，显示"?"
        ipLocation = {
            country: '?',
            regionName: '',
            city: '',
            lat: 0,
            lon: 0,
            query: currentIP,
            isError: true
        };
        showWelcome();

    } catch (e) {
        // 连 IP 都获取失败
        ipLocation = {
            country: '?',
            regionName: '',
            city: '',
            lat: 0,
            lon: 0,
            query: '未知',
            isError: true
        };
        showWelcome();
    }
}

// 计算两点之间的距离（公里）
function getDistance(e1, n1, e2, n2) {
    if (!e2 || !n2 || e2 === 0 || n2 === 0) return '∞';
    const R = 6371;
    const { sin, cos, asin, PI, hypot } = Math;
    let getPoint = (e, n) => {
        e *= PI / 180;
        n *= PI / 180;
        return { x: cos(n) * cos(e), y: cos(n) * sin(e), z: sin(n) };
    };
    let a = getPoint(e1, n1);
    let b = getPoint(e2, n2);
    let c = hypot(a.x - b.x, a.y - b.y, a.z - b.z);
    let r = asin(c / 2) * 2 * R;
    return Math.round(r);
}

function showWelcome() {
    if (!ipLocation) {
        setTimeout(showWelcome, 500);
        return;
    }

    let dist = getDistance(125.323, 43.817, ipLocation.lon, ipLocation.lat);

    let country = ipLocation.country;
    let province = ipLocation.regionName;
    let city = ipLocation.city;
    let ip = ipLocation.query;
    let pos = country;
    let posdesc;

    // 特殊情况处理
    if (ipLocation.isLocalPreview) {
        pos = '本地开发环境';
        posdesc = '🔧 正在本地预览中，推送到线上后可看到真实 IP 信息';
        dist = '∞';
    } else if (ipLocation.isIPv6) {
        pos = 'IPv6 网络';
        posdesc = '🚀 先进的技术！您正在使用 IPv6 连接';
        dist = '?';
        ip = '<br>IPv6: ' + (ip.length > 20 ? ip.substring(0, 20) + '...' : ip);
    } else if (ipLocation.isError || country === '?') {
        pos = '神秘的地方';
        posdesc = '🤔 无法确定您的位置，欢迎来到这个小站！';
        dist = '?';
    } else {
        // 正常模式：根据国家、省份、城市信息自定义欢迎语
        switch (country) {
            case "日本":
                posdesc = "よろしく，一起去看樱花吗";
                break;
            case "美国":
                posdesc = "Let us live in peace!";
                break;
            case "英国":
                posdesc = "想同你一起夜乘伦敦眼";
                break;
            case "俄罗斯":
                posdesc = "干了这瓶伏特加！";
                break;
            case "法国":
                posdesc = "C'est La Vie";
                break;
            case "德国":
                posdesc = "Die Zeit verging im Fluge.";
                break;
            case "澳大利亚":
                posdesc = "一起去大堡礁吧！";
                break;
            case "加拿大":
                posdesc = "拾起一片枫叶赠予你";
                break;
            case "中国":
                pos = province + " " + city;
                switch (province) {
                    case "北京":
                    case "北京市":
                        posdesc = "北——京——欢迎你~~~";
                        break;
                    case "天津":
                    case "天津市":
                        posdesc = "讲段相声吧";
                        break;
                    case "河北":
                    case "河北省":
                        posdesc = "山势巍巍成壁垒，天下雄关铁马金戈由此向，无限江山";
                        break;
                    case "山西":
                    case "山西省":
                        posdesc = "展开坐具长三尺，已占山河五百余";
                        break;
                    case "内蒙古":
                    case "内蒙古自治区":
                        posdesc = "天苍苍，野茫茫，风吹草低见牛羊";
                        break;
                    case "辽宁":
                    case "辽宁省":
                        posdesc = "我想吃烤鸡架！";
                        break;
                    case "吉林":
                    case "吉林省":
                        posdesc = "状元阁就是东北烧烤之王";
                        break;
                    case "黑龙江":
                    case "黑龙江省":
                        posdesc = "很喜欢哈尔滨大剧院";
                        break;
                    case "上海":
                    case "上海市":
                        posdesc = "众所周知，中国只有两个城市";
                        break;
                    case "江苏":
                    case "江苏省":
                        if (city && city.includes("南京")) {
                            posdesc = "这是我挺想去的城市啦";
                        } else if (city && city.includes("苏州")) {
                            posdesc = "上有天堂，下有苏杭";
                        } else {
                            posdesc = "散装是必须要散装的";
                        }
                        break;
                    case "浙江":
                    case "浙江省":
                        posdesc = "东风渐绿西湖柳，雁已还人未南归";
                        break;
                    case "河南":
                    case "河南省":
                        if (city && city.includes("郑州")) {
                            posdesc = "豫州之域，天地之中";
                        } else if (city && city.includes("南阳")) {
                            posdesc = "臣本布衣，躬耕于南阳此南阳非彼南阳！";
                        } else if (city && city.includes("驻马店")) {
                            posdesc = "峰峰有奇石，石石挟仙气嵖岈山的花很美哦！";
                        } else if (city && city.includes("开封")) {
                            posdesc = "刚正不阿包青天";
                        } else if (city && city.includes("洛阳")) {
                            posdesc = "洛阳牡丹甲天下";
                        } else {
                            posdesc = "可否带我品尝河南烩面啦？";
                        }
                        break;
                    case "安徽":
                    case "安徽省":
                        posdesc = "蚌埠住了，芜湖起飞";
                        break;
                    case "福建":
                    case "福建省":
                        posdesc = "井邑白云间，岩城远带山";
                        break;
                    case "江西":
                    case "江西省":
                        posdesc = "落霞与孤鹜齐飞，秋水共长天一色";
                        break;
                    case "山东":
                    case "山东省":
                        posdesc = "遥望齐州九点烟，一泓海水杯中泻";
                        break;
                    case "湖北":
                    case "湖北省":
                        if (city && city.includes("黄冈")) {
                            posdesc = "红安将军县！辈出将才！";
                        } else {
                            posdesc = "来碗热干面~";
                        }
                        break;
                    case "湖南":
                    case "湖南省":
                        posdesc = "74751，长沙斯塔克";
                        break;
                    case "广东":
                    case "广东省":
                        if (city && city.includes("广州")) {
                            posdesc = "看小蛮腰，喝早茶了嘛~";
                        } else if (city && city.includes("深圳")) {
                            posdesc = "今天你逛商场了嘛~";
                        } else if (city && city.includes("阳江")) {
                            posdesc = "阳春合水！博主家乡~ 欢迎来玩~";
                        } else {
                            posdesc = "来两斤福建人~";
                        }
                        break;
                    case "广西":
                    case "广西壮族自治区":
                        posdesc = "桂林山水甲天下";
                        break;
                    case "海南":
                    case "海南省":
                        posdesc = "朝观日出逐白浪，夕看云起收霞光";
                        break;
                    case "四川":
                    case "四川省":
                        posdesc = "康康川妹子";
                        break;
                    case "贵州":
                    case "贵州省":
                        posdesc = "茅台，学生，再塞200";
                        break;
                    case "云南":
                    case "云南省":
                        posdesc = "玉龙飞舞云缠绕，万仞冰川直耸天";
                        break;
                    case "西藏":
                    case "西藏自治区":
                        posdesc = "躺在茫茫草原上，仰望蓝天";
                        break;
                    case "陕西":
                    case "陕西省":
                        posdesc = "来份臊子面加馍";
                        break;
                    case "甘肃":
                    case "甘肃省":
                        posdesc = "羌笛何须怨杨柳，春风不度玉门关";
                        break;
                    case "青海":
                    case "青海省":
                        posdesc = "牛肉干和老酸奶都好好吃";
                        break;
                    case "宁夏":
                    case "宁夏回族自治区":
                        posdesc = "大漠孤烟直，长河落日圆";
                        break;
                    case "新疆":
                    case "新疆维吾尔自治区":
                        posdesc = "驼铃古道丝绸路，胡马犹闻唐汉风";
                        break;
                    case "台湾":
                    case "台湾省":
                        posdesc = "我在这头，大陆在那头";
                        break;
                    case "香港":
                    case "香港特别行政区":
                        posdesc = "永定贼有残留地鬼嚎，迎击光非岁玉";
                        break;
                    case "澳门":
                    case "澳门特别行政区":
                        posdesc = "性感荷官，在线发牌";
                        break;
                    default:
                        posdesc = "带我去你的城市逛逛吧！";
                        break;
                }
                break;
            default:
                posdesc = "带我去你的国家逛逛吧";
                break;
        }
    }

    // 根据本地时间切换欢迎语
    let timeChange;
    let date = new Date();
    if (date.getHours() >= 5 && date.getHours() < 11) {
        timeChange = "<span>🌤️ 早上好，一日之计在于晨</span>";
    } else if (date.getHours() >= 11 && date.getHours() < 13) {
        timeChange = "<span>☀️ 中午好，记得午休喔~</span>";
    } else if (date.getHours() >= 13 && date.getHours() < 17) {
        timeChange = "<span>🕞 下午好，饮茶先啦！</span>";
    } else if (date.getHours() >= 17 && date.getHours() < 19) {
        timeChange = "<span>🚶‍♂️ 即将下班，记得按时吃饭~</span>";
    } else if (date.getHours() >= 19 && date.getHours() < 24) {
        timeChange = "<span>🌙 晚上好，夜生活嗨起来！</span>";
    } else {
        timeChange = "夜深了，早点休息，少熬夜";
    }

    try {
        document.getElementById("welcome-info").innerHTML =
            `欢迎来自 <b><span style="color: var(--kouseki-ip-color);font-size: var(--kouseki-gl-size)">${pos}</span></b> 的小友💖<br>${posdesc}🍂<br>当前位置距博主约 <b><span style="color: var(--kouseki-ip-color)">${dist}</span></b> 公里！<br>您的IP地址为：<b><span>${ip}</span></b><br>${timeChange} <br>`;
    } catch (err) {
        console.log("Pjax无法获取元素");
    }
}

// 初始化
window.onload = fetchIPLocation;
document.addEventListener('pjax:complete', fetchIPLocation);