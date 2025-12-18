
import { ExamEvent, ResourceItem, CommunityNote } from '../types';

// Updated Real Data for Dec 18, 2025 Context
export const fetchExamCalendar = async (): Promise<ExamEvent[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return [
        { 
            id: 'nk-2026-written', 
            title: '2026年国家公务员考试：笔试结束', 
            dateStr: '2025年11月29日-30日', 
            type: 'national', 
            status: 'ended', 
            month: 11, 
            year: 2025,
            tags: ['26国考', '笔试已完'],
            description: '2026年度国考笔试已于11月底顺利结束。目前正处于阅卷阶段，官方成绩预计将于2026年1月上旬发布。'
        },
        { 
            id: 'sk-2026-bj-sh-js', 
            title: '2026年京/沪/苏/深定向：面试期', 
            dateStr: '2025年12月', 
            type: 'provincial', 
            status: 'ongoing', 
            month: 12, 
            year: 2025,
            tags: ['京考', '苏考', '资格复审'],
            description: '北京、上海、江苏等提前批次省考已完成笔试。目前各单位正陆续发布面试资格复审公告，考生需密切关注面试名单。'
        },
        { 
            id: 'sk-2026-joint-countdown', 
            title: '2026年全国多省联考：公告预警期', 
            dateStr: '2026年1月-2月', 
            type: 'provincial', 
            status: 'upcoming', 
            month: 1, 
            year: 2026,
            tags: ['26联考', '公告倒计时'],
            description: '预计2026年1月中下旬起，各联考省份将密集发布招考公告。'
        },
        { 
            id: 'nk-2026-interview-prep', 
            title: '2026年国考：首批入面名单发布', 
            dateStr: '2026年1月8日（预计）', 
            type: 'national', 
            status: 'upcoming', 
            month: 1, 
            year: 2026,
            tags: ['26国考', '查分时间'],
            description: '根据往年惯例，国考笔试成绩与首批面试名单通常在元旦后的首周发布。'
        },
        { 
            id: 'mil-2026-announce', 
            title: '2026年全军文职人员公开招考', 
            dateStr: '2025年12月-2026年1月', 
            type: 'institution', 
            status: 'registering', 
            month: 12, 
            year: 2025,
            tags: ['军队文职', '报名中'],
            description: '2026年军队文职招考已进入报名中后期，请考生抓紧时间。'
        },
    ];
};

export const fetchStudyMaterials = async (): Promise<ResourceItem[]> => {
    await new Promise(resolve => setTimeout(resolve, 600));

    return [
        { 
            id: 'real-25-shenlun', 
            title: '2025年国家公务员考试《申论》真题试卷与答案解析', 
            source: '官方发布', 
            type: 'paper', 
            category: '真题',
            publishDate: '2025-01-08', 
            tags: ['25国考', '申论', '全套解析'], 
            isRealFile: true,
            storageBucket: 'exam-pdfs',      
            storagePath: '25guokao_shenlun.pdf' 
        },
        { 
            id: 'real-25-xingce-fusheng', 
            title: '2025年国家公务员考试《行测》副省级真题试卷与答案解析', 
            source: '官方发布', 
            type: 'paper', 
            category: '真题',
            publishDate: '2025-01-08', 
            tags: ['25国考', '行测', '副省级'], 
            isRealFile: true,
            storageBucket: 'exam-pdfs',      
            storagePath: '25guokao_xingce_fushengji.pdf' 
        },
        { 
            id: 'real-25-xingce-zhifa', 
            title: '2025年国家公务员考试《行测》行政执法类真题试卷与答案解析', 
            source: '官方发布', 
            type: 'paper', 
            category: '真题',
            publishDate: '2025-01-08', 
            tags: ['25国考', '行测', '行政执法'], 
            isRealFile: true,
            storageBucket: 'exam-pdfs',      
            storagePath: '25guokao_xingce_xingzhengzhifa.pdf' 
        },
        { 
            id: 'real-25-xingce-zonghe', 
            title: '2025年国家公务员考试《行测》地市级/综合管理类真题试卷与答案解析', 
            source: '官方发布', 
            type: 'paper', 
            category: '真题',
            publishDate: '2025-01-08', 
            tags: ['25国考', '行测', '综合管理'], 
            isRealFile: true,
            storageBucket: 'exam-pdfs',      
            storagePath: '25guokao_xingce_zhongheguanli.pdf' 
        },
        { 
            id: 'mock-26-shenlun-ai', 
            title: '2026年国考备考：申论大作文押题模拟卷', 
            source: 'AI智能题库', 
            type: 'paper', 
            category: '模拟',
            publishDate: '2025-12-15', 
            tags: ['26国考', '申论', 'AI押题'], 
            isRealFile: false
        },
        { 
            id: 'mock-26-logic-ai', 
            title: '2026年省考联考：行测《逻辑判断》高频考点模拟', 
            source: 'AI智能题库', 
            type: 'paper', 
            category: '模拟',
            publishDate: '2025-12-10', 
            tags: ['行测', '逻辑判断', '专项'], 
            isRealFile: false
        },
        { 
            id: 'mock-26-data-ai', 
            title: '2026年省考联考：行测《资料分析》计算提速模拟', 
            source: 'AI智能题库', 
            type: 'paper', 
            category: '模拟',
            publishDate: '2025-12-10', 
            tags: ['行测', '资料分析', '模拟'], 
            isRealFile: false
        },
        { 
            id: 'mock-26-verbal-ai', 
            title: '2026年省考联考：行测《言语理解》选词填空专项模拟', 
            source: 'AI智能题库', 
            type: 'paper', 
            category: '模拟',
            publishDate: '2025-12-05', 
            tags: ['行测', '言语理解', '专项'], 
            isRealFile: false
        }
    ];
};

export const fetchPolicyArticles = async (): Promise<ResourceItem[]> => {
    await new Promise(resolve => setTimeout(resolve, 600));

    return [
        { 
            id: 'p-2026-gk-analysis', 
            title: '2026年度国考大数据：过审人数首破340万，平均竞争比分析', 
            source: '国家公务员局', 
            type: 'policy', 
            category: '公告',
            publishDate: '2025-12-05', 
            summary: '2026年度国考报名数据统计出炉。本篇通过深度建模分析各系统（税务、海关、海事）的进面预测线与调剂空间。',
            tags: ['国考', '竞争比'], 
            url: 'http://bm.scs.gov.cn/' 
        },
        { 
            id: 'p-2026-sk-changes', 
            title: '2026年省考联考前瞻：多省份扩招趋势与笔试命题新变化', 
            source: '人民网', 
            type: 'policy', 
            category: '解读',
            publishDate: '2025-12-15', 
            summary: '针对即将到来的2026年春季省考联考，专家指出基层岗位比例持续提升，且面试环节将更侧重于政治素质考察。',
            tags: ['省考', '备考策略'], 
            url: 'http://edu.people.com.cn/' 
        },
        { 
            id: 'p-interview-red', 
            title: '【权威】公务员录用考察中“社会化评价”与“政审”最新指南', 
            source: '党建网', 
            type: 'policy', 
            category: '指南',
            publishDate: '2025-12-10', 
            summary: '梳理了2026年录用考察环节的最新红线要求。',
            tags: ['政审', '录用考察'], 
            url: 'http://www.dangjian.com/' 
        },
        { 
            id: 'p-age-policy-2026', 
            title: '2026年报考指南：应届生界定与报考年龄放宽政策汇总', 
            source: '教育部', 
            type: 'policy', 
            category: '公告',
            publishDate: '2025-12-18', 
            summary: '明确了2024-2026届应届生在省考中的身份认定标准。',
            tags: ['报考政策', '身份认定'], 
            url: 'http://www.moe.gov.cn/' 
        }
    ];
};

export const fetchCommunityNotes = async (): Promise<CommunityNote[]> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return [
        { 
            id: 'n1', 
            title: '2026国考行测复盘：资料分析如何做到20分钟满分', 
            author: '学霸小王', 
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
            summary: '分享资料分析速算技巧，亲测有效。', 
            fileType: 'pdf', 
            size: '4.2MB', 
            downloads: 1250, 
            likes: 420,
            uploadDate: '2025-12-01', 
            category: '行测',
            tags: ['26国考', '高分心得']
        },
        { 
            id: 'n2', 
            title: '申论大作文：12月最新时政热点关键词语库', 
            author: '笔耕不辍', 
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
            summary: '整理了最近一个月的人民日报评论员文章精华，适合申论背诵。', 
            fileType: 'doc', 
            size: '1.8MB', 
            downloads: 5600, 
            likes: 890,
            uploadDate: '2025-12-15', 
            category: '申论',
            tags: ['申论', '时政']
        },
    ];
};
