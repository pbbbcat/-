
import { ExamEvent, ResourceItem, CommunityNote } from '../types';

// Updated Real Data for Current Real-World Context (Early 2025)
// This assumes the user is using the app in Feb 2025 (Real Time)
export const fetchExamCalendar = async (): Promise<ExamEvent[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return [
        // --- 2025 National Exam (Cycle Ending) ---
        { 
            id: 'nk-2025-score', 
            title: '2025年国考：面试名单与调剂', 
            dateStr: '2025年1月-2月', 
            type: 'national', 
            status: 'ended', 
            month: 1, 
            year: 2025,
            tags: ['25国考', '面试名单'],
            description: '笔试成绩已发布，首批面试名单已公布，调剂报名与审核结束。'
        },
        { 
            id: 'nk-2025-interview', 
            title: '2025年国考：面试高峰期', 
            dateStr: '2025年2月-3月', 
            type: 'national', 
            status: 'ongoing', 
            month: 2, 
            year: 2025,
            tags: ['25国考', '面试'],
            description: '税务、海关、海事等各大系统陆续开启面试，请注意查阅具体递补与面试公告。'
        },

        // --- 2025 Independent Provincial Exams (Finished Written, Interviewing) ---
        { 
            id: 'sk-2025-early-interview', 
            title: '江/浙/鲁/沪/京：省考面试', 
            dateStr: '2025年2月下旬-3月', 
            type: 'provincial', 
            status: 'ongoing', 
            month: 2, 
            year: 2025,
            tags: ['独立省考', '面试'],
            description: '江苏、浙江、山东、上海、北京等提前批省份笔试已结束，进入面试资格复审与面试阶段。'
        },

        // --- 2025 Provincial Joint Exam (The BIG One) ---
        { 
            id: 'sk-2025-joint-announce', 
            title: '2025年多省联考：报名冲刺', 
            dateStr: '2025年1月-2月', 
            type: 'provincial', 
            status: 'ended', 
            month: 2, 
            year: 2025,
            tags: ['25联考', '报名'],
            description: '河南、湖北、湖南、福建、云南、广西等20余省份公告已出，报名及缴费工作陆续截止。'
        },
        { 
            id: 'sk-2025-guangdong', 
            title: '2025年广东省考（非联考）', 
            dateStr: '2025年3月（预计）', 
            type: 'provincial', 
            status: 'upcoming', 
            month: 3, 
            year: 2025,
            tags: ['广东省考', '笔试'],
            description: '广东通常不参加联考，预计3月中旬前后举行笔试（具体以官方公告为准）。'
        },
        { 
            id: 'sk-2025-joint-exam', 
            title: '2025年多省公务员联考笔试', 
            dateStr: '2025年3月29日-30日', 
            type: 'provincial', 
            status: 'upcoming', 
            month: 3, 
            year: 2025,
            tags: ['25联考', '笔试', '重要'],
            description: '全国20余个省份同步举行笔试。3月29日上午行测，下午申论；30日公安专业科目。'
        },

        // --- Institution Exams ---
        { 
            id: 'sydw-2025-h1', 
            title: '2025年上半年事业单位联考', 
            dateStr: '2025年5月24日（预计）', 
            type: 'institution', 
            status: 'upcoming', 
            month: 5, 
            year: 2025,
            tags: ['事业单位', 'A-E类'],
            description: '全国多省份参加的事业单位公开招聘分类考试（5.24为大概率时间）。'
        },
        
        // --- 2026 Cycle Preview ---
         { 
            id: 'nk-2026-announce', 
            title: '2026年国家公务员考试公告', 
            dateStr: '2025年10月中旬', 
            type: 'national', 
            status: 'upcoming', 
            month: 10, 
            year: 2025,
            tags: ['26国考', '公告'],
            description: '新一轮国考周期将于下半年启动，10月中旬发布公告，11月底或12月初笔试。'
        },
    ];
};

// Mock Data combined with REAL Supabase Storage file
export const fetchStudyMaterials = async (): Promise<ResourceItem[]> => {
    await new Promise(resolve => setTimeout(resolve, 600));

    // We no longer pre-calculate the public URL. 
    // Instead we provide metadata for the component to fetch a Signed URL on click.
    return [
        // --- 真实真题 (Supabase Storage) ---
        { 
            id: 'real-sk-shenlun', 
            title: '2025年国家公务员考试《申论》真题试卷与答案解析', 
            source: 'Supabase数据库', 
            type: 'paper', 
            publishDate: '2025-01-05', 
            tags: ['25国考', '申论', '真题PDF', '含解析'], 
            downloadCount: 12050,
            isRealFile: true,
            storageBucket: 'exam-pdfs',      
            storagePath: '25guokao_shenlun.pdf' 
        },
        { 
            id: 'real-sk-xingce-fu', 
            title: '2025年国家公务员考试《行测》副省级真题试卷与答案解析', 
            source: 'Supabase数据库', 
            type: 'paper', 
            publishDate: '2025-01-05', 
            tags: ['25国考', '行测', '副省级', '含解析'], 
            downloadCount: 15420,
            isRealFile: true,
            storageBucket: 'exam-pdfs',      
            storagePath: '25guokao_xingce_fushengji.pdf' 
        },
        { 
            id: 'real-sk-xingce-zhifa', 
            title: '2025年国家公务员考试《行测》行政执法类真题试卷与答案解析', 
            source: 'Supabase数据库', 
            type: 'paper', 
            publishDate: '2025-01-05', 
            tags: ['25国考', '行测', '行政执法', '含解析'], 
            downloadCount: 13200,
            isRealFile: true,
            storageBucket: 'exam-pdfs',      
            storagePath: '25guokao_xingce_xingzhengzhifa.pdf' 
        },
        { 
            id: 'real-sk-xingce-zhonghe', 
            title: '2025年国家公务员考试《行测》综合管理类真题试卷与答案解析', 
            source: 'Supabase数据库', 
            type: 'paper', 
            publishDate: '2025-01-05', 
            tags: ['25国考', '行测', '综合管理', '含解析'], 
            downloadCount: 11800,
            isRealFile: true,
            storageBucket: 'exam-pdfs',      
            storagePath: '25guokao_xingce_zhongheguanli.pdf' 
        },

        // --- 模拟题/其他 ---
        { id: 'm1', title: '2025年公务员考试《行测》逻辑判断专项模拟卷', source: '粉笔模拟', type: 'paper', publishDate: '2025-01-15', tags: ['行测', '逻辑判断'], downloadCount: 3420 },
        { id: 'm2', title: '2025年申论（行政执法类）全真模拟卷', source: '华图教育', type: 'paper', publishDate: '2025-02-01', tags: ['申论', '行政执法'], downloadCount: 2100 },
        { id: 'm4', title: '2025年资料分析速算技巧专项练习', source: '公考智囊', type: 'paper', publishDate: '2025-02-10', tags: ['资料分析', '技巧'], downloadCount: 1200 },
    ];
};

// Real Data for Policy News with ACTUAL URLs
export const fetchPolicyArticles = async (): Promise<ResourceItem[]> => {
    await new Promise(resolve => setTimeout(resolve, 600));

    return [
        { 
            id: 'a1', 
            title: '国家公务员局：中央机关及其直属机构2025年度考试录用公务员公告', 
            source: '国家公务员局', 
            type: 'policy', 
            publishDate: '2024-10-14', 
            tags: ['国考', '公告'], 
            url: 'http://bm.scs.gov.cn/pp/gkweb/core/web/ui/business/article/articledetail.html?ArticleId=8a81f6d091e97d1b019289659b9a0024&id=0000000062b7b2b60162bccf03930009&eid=0000000062b7b2b60162bccf480c000a' 
        },
        { 
            id: 'a2', 
            title: '人力资源社会保障部关于做好2025年全国高校毕业生就业创业工作的通知', 
            source: '人社部', 
            type: 'policy', 
            publishDate: '2024-11-20', 
            tags: ['应届生', '就业'], 
            url: 'http://www.mohrss.gov.cn/SYrlzyhshbzb/jycy/zcwj/202411/t20241122_530181.html' 
        },
        { 
            id: 'a3', 
            title: '深度解读：新版《公务员录用体检通用标准（试行）》', 
            source: '中国政府网', 
            type: 'policy', 
            publishDate: '2024-12-05', 
            tags: ['体检', '标准'], 
            url: 'https://www.gov.cn/gongbao/content/2016/content_5139598.htm' 
        },
        { 
            id: 'a4', 
            title: '2025年多省联考报考趋势分析：基层岗位占比提升', 
            source: '新华网', 
            type: 'policy', 
            publishDate: '2025-02-10', 
            tags: ['联考', '趋势'], 
            url: 'http://www.news.cn/politics/' 
        },
    ];
};

// Rich Mock Data for Community
export const fetchCommunityNotes = async (): Promise<CommunityNote[]> => {
    await new Promise(resolve => setTimeout(resolve, 400));

    return [
        { 
            id: 'n1', 
            title: '2025国考行测复盘与估分（地市级）手写版', 
            author: '上岸小锦鲤', 
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
            summary: '刚考完趁热整理的，常识部分有几个不确定的，逻辑推理全解析。包含了对数量关系蒙题技巧的实战验证。', 
            fileType: 'pdf', 
            size: '12MB', 
            downloads: 3542, 
            likes: 420,
            uploadDate: '2024-12-02', 
            category: '行测',
            tags: ['真题回忆', '国考', '复盘']
        },
        { 
            id: 'n2', 
            title: '申论“踩点给分”万能公式表（背诵版）', 
            author: '笔杆子老王', 
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
            summary: '总结了单一题、综合分析题、贯彻执行题的标准答题逻辑框架。针对2025大纲新变化做了微调。', 
            fileType: 'doc', 
            size: '2.5MB', 
            downloads: 8901, 
            likes: 1250,
            uploadDate: '2025-01-05', 
            category: '申论',
            tags: ['模板', '背诵', '高分']
        },
        { 
            id: 'n3', 
            title: '2025江苏省考A/B/C类公基考点思维导图', 
            author: '苏考通', 
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Callie',
            summary: 'XMind源文件，涵盖了江苏特色的省情、时政、法律常识。', 
            fileType: 'xmind', 
            size: '5MB', 
            downloads: 2200, 
            likes: 340,
            uploadDate: '2025-02-10', 
            category: '综合',
            tags: ['思维导图', '省考', '公基']
        },
        { 
            id: 'n4', 
            title: '结构化面试：人际关系题破题金句50例', 
            author: '面试大魔王', 
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoey',
            summary: '不仅有话术，还有语气语调的标注。适合进面小白突击使用。', 
            fileType: 'pdf', 
            size: '1.8MB', 
            downloads: 1560, 
            likes: 210,
            uploadDate: '2025-01-20', 
            category: '面试',
            tags: ['面试', '话术', '突击']
        },
        { 
            id: 'n5', 
            title: '数量关系：工程问题与行程问题秒杀技巧', 
            author: '数学小王子', 
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack',
            summary: '放弃数量关系？看完这个文档再决定！教你如何用60秒解决一道难题。', 
            fileType: 'pdf', 
            size: '4.2MB', 
            downloads: 4100, 
            likes: 680,
            uploadDate: '2025-02-01', 
            category: '行测',
            tags: ['数量关系', '技巧', '秒杀']
        }
    ];
};
