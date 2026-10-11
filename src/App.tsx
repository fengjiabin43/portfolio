import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { Palette, X, ArrowRight, Mail, Phone, Copy, Check, GraduationCap, ExternalLink } from 'lucide-react';

const publicAsset = (fileName: string) => `${import.meta.env.BASE_URL}${fileName}`;

// --- Algorithmic Ice Cube (Canvas 3D) ---
const AlgorithmicIceCube = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 500], [1, 0.1]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const particles: any[] = [];
    const numParticles = 3500;
    const S = 130; // Half-size of the cube

    for (let i = 0; i < numParticles; i++) {
      let x = (Math.random() - 0.5) * 2 * S;
      let y = (Math.random() - 0.5) * 2 * S;
      let z = (Math.random() - 0.5) * 2 * S;

      let type = Math.random();
      let isSurface = type < 0.6;
      
      if (isSurface) {
        let ax = Math.abs(x), ay = Math.abs(y), az = Math.abs(z);
        let max = Math.max(ax, ay, az);
        if (max === ax) x = Math.sign(x) * S;
        else if (max === ay) y = Math.sign(y) * S;
        else z = Math.sign(z) * S;
      } else if (type < 0.8) {
        // Inner core (frost)
        x *= 0.4; y *= 0.4; z *= 0.4;
      }

      let ax = Math.abs(x), ay = Math.abs(y), az = Math.abs(z);
      let isEdgeX = ax > S * 0.9;
      let isEdgeY = ay > S * 0.9;
      let isEdgeZ = az > S * 0.9;
      let edgeCount = (isEdgeX ? 1 : 0) + (isEdgeY ? 1 : 0) + (isEdgeZ ? 1 : 0);

      let color = '';
      let size = 1;

      if (edgeCount >= 2) {
        color = `rgba(255, 255, 255, 0.9)`; // White edges
        size = Math.random() * 2 + 1;
      } else if (isSurface) {
        if (y === -S) { // Top face
          color = `rgba(200, 245, 255, 0.8)`;
        } else if (z === S) { // Front face
          color = `rgba(120, 210, 255, 0.7)`;
        } else if (x === S || x === -S) { // Side faces
          color = `rgba(70, 170, 255, 0.6)`;
        } else { // Bottom/Back
          color = `rgba(40, 120, 220, 0.5)`;
        }
        size = Math.random() * 1.5 + 0.5;
      } else {
        if (type < 0.8) {
          color = `rgba(255, 255, 255, 0.7)`; // Inner frost
          size = Math.random() * 2 + 0.5;
        } else {
          color = `rgba(150, 220, 255, 0.3)`; // Volume fill
          size = Math.random() * 1 + 0.5;
        }
      }

      particles.push({
        baseX: x, baseY: y, baseZ: z,
        x, y, z,
        vx: 0, vy: 0, vz: 0,
        color,
        size
      });
    }

    let angleX = -0.4; // Initial tilt to show top face
    let angleY = 0.5;  // Initial rotation to show side face
    let mouse = { x: width / 2, y: height / 2, active: false };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };
    const handleMouseLeave = () => { mouse.active = false; };
    const handleTouchMove = (e: TouchEvent) => {
      mouse.x = e.touches[0].clientX;
      mouse.y = e.touches[0].clientY;
      mouse.active = true;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('touchmove', handleTouchMove);

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Continuous slow rotation for 3D effect
      angleX += 0.003;
      angleY += 0.005;

      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);

      particles.forEach(p => {
        // Rotate base position
        let x1 = p.baseX * cosY - p.baseZ * sinY;
        let z1 = p.baseZ * cosY + p.baseX * sinY;
        let y1 = p.baseY * cosX - z1 * sinX;
        let z2 = z1 * cosX + p.baseY * sinX;

        // Apply physics if mouse active
        let targetX = x1;
        let targetY = y1;
        let targetZ = z2;

        if (mouse.active) {
          const screenX = width / 2 + x1;
          const screenY = height / 2 + y1;
          const dx = mouse.x - screenX;
          const dy = mouse.y - screenY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 180) {
            const force = (180 - dist) / 180;
            targetX -= dx * force * 0.8;
            targetY -= dy * force * 0.8;
            targetZ -= force * 50; // push back
          }
        }

        // Spring physics towards target
        p.vx += (targetX - p.x) * 0.08;
        p.vy += (targetY - p.y) * 0.08;
        p.vz += (targetZ - p.z) * 0.08;
        
        p.vx *= 0.75; // friction
        p.vy *= 0.75;
        p.vz *= 0.75;

        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
      });

      // Sort particles by Z depth for proper transparency blending
      const sortedParticles = [...particles].sort((a, b) => b.z - a.z);

      ctx.globalAlpha = width < 768 ? 0.32 : 1;
      sortedParticles.forEach(p => {
        const fov = 800;
        const scale = fov / (fov + p.z + 300);
        const screenX = width / 2 + p.x * scale;
        const screenY = height / 2 + p.y * scale;

        if (scale > 0) {
          ctx.beginPath();
          ctx.arc(screenX, screenY, Math.max(0.5, p.size * scale), 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
        }
      });
      ctx.globalAlpha = 1;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <motion.canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-0"
      style={{ opacity }}
    />
  );
};

// --- Typewriter ---
const Typewriter = ({ text }: { text: string }) => {
  const [displayed, setDisplayed] = useState("");
  
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.substring(0, i));
      i++;
      if (i > text.length) clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, [text]);

  return <span className="font-mono text-zinc-400">{displayed}<span className="animate-pulse text-sky-400">_</span></span>;
};

// --- 3D Work Card ---
const WorkCard = ({ project, onClick }: { project: any, onClick: () => void }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePos({ x, y });
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateXVal = ((y - centerY) / centerY) * -10;
    const rotateYVal = ((x - centerX) / centerX) * 10;
    
    setRotateX(rotateXVal);
    setRotateY(rotateYVal);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setIsHovered(false);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      animate={{ rotateX, rotateY }}
      transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.5 }}
      style={{ transformStyle: "preserve-3d" }}
      className={`group relative w-full cursor-pointer rounded-2xl border border-white/5 bg-zinc-900/50 ${project.cardSizeClass || 'h-[400px] sm:h-[420px] xl:h-[440px]'}`}
    >
      {/* Spotlight Border */}
      {isHovered && (
        <div 
          className="absolute inset-0 rounded-2xl pointer-events-none z-20"
          style={{
            background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, ${project.color}40, transparent 40%)`,
            maskImage: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'exclude',
            WebkitMaskComposite: 'xor',
            padding: '2px'
          }}
        />
      )}
      
      {/* Dynamic Shadow */}
      <div 
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl -z-10"
        style={{ background: project.color }}
      />

      {/* Background Image Container */}
      {project.image && (
        <div 
          className={`absolute inset-0 h-full w-full overflow-hidden rounded-2xl transition-opacity duration-500 ${project.cardImageClass || 'opacity-40 group-hover:opacity-70'}`}
          style={{ backgroundColor: project.imageBg || 'white' }}
        >
          <img 
            src={project.image} 
            alt={project.title}
            className={`w-full h-full ${project.imageFit === 'cover' ? `object-cover ${project.imagePosition === 'top' ? 'object-top' : 'object-center'}` : 'object-contain p-4 pb-24'}`}
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      <div className={`absolute inset-0 z-10 flex flex-col justify-end rounded-2xl bg-gradient-to-t p-6 sm:p-7 ${project.cardOverlayClass || 'from-[#050505] via-[#050505]/80 to-transparent'}`} style={{ transform: "translateZ(30px)" }}>
        <h3 className="mb-2 font-sans text-2xl font-bold leading-tight text-white">{project.title}</h3>
        <div className="mb-2 font-mono text-xs leading-5 tracking-widest" style={{ color: project.color }}>{project.tag}</div>
        <p className="line-clamp-2 font-mono text-sm leading-6 text-zinc-400">{project.desc}</p>
      </div>
    </motion.div>
  );
};

// --- Main App ---
export default function App() {
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [contactOpen, setContactOpen] = useState(false);
  const [copiedContact, setCopiedContact] = useState<'phone' | 'email' | null>(null);

  const copyContact = async (type: 'phone' | 'email', value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedContact(type);
      window.setTimeout(() => setCopiedContact(null), 1800);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = value;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
      setCopiedContact(type);
      window.setTimeout(() => setCopiedContact(null), 1800);
    }
  };

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setContactOpen(false);
      setSelectedProject(null);
      setZoomedImage(null);
      setZoomScale(1);
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);
  const projects = [
    {
      id: 1,
      title: "2026测测你是什么马",
      tag: "独立开发",
      color: "#eab308", // Yellow
      imageFit: "cover",
      desc: "一款基于 React + Tailwind CSS 开发的 2026 新年运势/性格测试 H5 互动网页。",
      content: "项目背景：2026新年互动小游戏，通过趣味测试得出用户的“马”属性。\n技术栈：React, Tailwind CSS, 响应式设计。\n设计风格：复古像素风/趣味排版，使用 ZCOOL KuaiLe 字体，包含扫描线等动态视觉效果。",
      image: "https://i.postimg.cc/VfBsGqQ8/image.png",
      link: "https://fengjiabin43.github.io/2026horse/",
      linkLabel: "fengjiabin43.github.io/2026horse"
    },
    {
      id: 2,
      title: "新春祝福语生成器",
      tag: "AI 工具",
      color: "#ef4444", // Red
      imageFit: "cover",
      desc: "一款基于大模型的新春祝福语生成工具，帮助用户快速生成个性化拜年文案。",
      content: "项目背景：解决春节期间群发祝福缺乏新意、难以针对不同长辈/领导/朋友定制文案的痛点。\n核心功能：用户输入收件人身份、关系及特定关键词，AI 自动生成风格多样的祝福语。\n技术栈：React, Tailwind CSS, Vercel 部署。",
      image: "https://image.thum.io/get/width/1200/crop/800/https://2026-new-year-greeting-generator.vercel.app/",
      link: "https://2026-new-year-greeting-generator.vercel.app/",
      linkLabel: "2026-new-year-greeting-generator.vercel.app"
    },
    {
      id: 3,
      title: "AI 电商产品修图专家",
      tag: "AI 工具",
      color: "#3b82f6", // Blue
      imageFit: "cover",
      desc: "一款基于 AI 的电商主图/产品图智能修图与生成工具，提升电商运营效率。",
      content: "项目背景：电商商家在产品图处理上耗费大量时间与成本，需要更高效的解决方案。\n核心功能：通过 AI 技术实现一键抠图、背景替换、光影调整及场景生成，快速产出高质量电商主图。\n技术栈：React, Tailwind CSS, AI 图像处理技术。",
      image: "https://api.microlink.io/?url=https://fengjiabin43.github.io/dianshangzhutu/&screenshot=true&meta=false&embed=screenshot.url",
      link: "https://fengjiabin43.github.io/dianshangzhutu/",
      linkLabel: "fengjiabin43.github.io/dianshangzhutu",
      detailImages: [
        {
          url: "https://i.postimg.cc/k4H7Frmk/shi-yong-jie-tu.png",
          caption: "功能使用图：直观的操作界面，支持一键上传与处理",
          layout: "full"
        },
        {
          url: "https://i.postimg.cc/VLrWFXq0/04aef3c9d4cc35c0497aabd24bb73976.jpg",
          caption: "原始图：包含复杂背景的模特实拍图",
          layout: "half"
        },
        {
          url: "https://i.postimg.cc/CM43gTXK/zhi-neng-xiu-tu-1774331824522.jpg",
          caption: "效果图：AI 智能抠图并生成纯净白底商品图",
          layout: "half"
        }
      ]
    }
  ];

  const startupProjects = [
    {
      id: 'startup-aiootd',
      isStartup: true,
      startupType: 'aiootd',
      title: "AIOOTD｜AI 穿搭 Agent",
      tag: "创始人 / 产品负责人",
      color: "#a855f7",
      imageFit: "cover",
      imagePosition: "top",
      cardImageClass: "opacity-80 group-hover:opacity-100",
      cardOverlayClass: "from-[#050505] via-[#050505]/40 to-transparent",
      cardSizeClass: "h-[420px] sm:h-[440px] xl:h-[460px]",
      desc: "把衣橱装进手机，让 AI 根据天气、场合和个人偏好完成推荐与虚拟试穿。",
      image: publicAsset("aiootd-poster.png"),
      link: "https://aiootd.vip/",
      linkLabel: "aiootd.vip",
    },
    {
      id: 'startup-tiktok',
      isStartup: true,
      startupType: 'tiktok',
      title: "TikTok 东南亚电商",
      tag: "创业实践 / 跨境电商",
      color: "#0ea5e9",
      imageFit: "cover",
      cardImageClass: "opacity-90 brightness-110 group-hover:opacity-100",
      cardOverlayClass: "from-[#050505] via-[#050505]/35 to-transparent",
      cardSizeClass: "h-[420px] sm:h-[440px] xl:h-[460px]",
      desc: "独立操盘泰国男装店铺，用选品、内容与促销跑通从曝光到成交的经营闭环。",
      image: publicAsset("tiktok-commerce-showcase.png"),
    },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050505] text-zinc-100 font-sans selection:bg-sky-500/30">
      
      <AlgorithmicIceCube />

      {/* Hero Section */}
      <section id="home" className="relative z-10 min-h-[90svh] px-5 md:px-8 xl:px-12">
        <div className="mx-auto flex min-h-[90svh] max-w-[1600px] flex-col">
          <header className="flex h-20 shrink-0 items-center justify-between border-b border-white/10">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-3 text-left"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-sky-300/30 bg-sky-400/10 font-mono text-xs font-bold text-sky-300">
                冯
              </span>
              <span className="hidden text-sm font-medium text-zinc-300 sm:block">欢迎来到冯嘉斌的个人网站</span>
            </button>

            <div className="flex items-center gap-2 font-mono text-xs text-zinc-300">
              <button
                type="button"
                onClick={() => setContactOpen(true)}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 transition-colors hover:border-sky-300/50 hover:bg-sky-300/10 hover:text-white"
              >
                <Mail className="h-4 w-4 text-sky-300" />
                联系我
              </button>
              <span className="hidden h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 sm:inline-flex">
                <GraduationCap className="h-4 w-4 text-zinc-500" />
                2027 届
              </span>
              <span className="hidden h-10 items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] px-4 sm:inline-flex">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.85)]" />
                正在求职
              </span>
            </div>
          </header>

          <div className="grid flex-1 grid-cols-1 items-center gap-10 py-12 md:grid-cols-[minmax(240px,0.78fr)_minmax(380px,1.22fr)] md:gap-6 lg:grid-cols-[minmax(240px,0.82fr)_minmax(420px,1.42fr)_minmax(340px,1fr)] lg:gap-7 lg:py-0">
            <motion.div
              initial={{ opacity: 0, x: -32 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="relative z-20 max-w-md md:pb-10"
            >
              <h1 className="mb-7 text-[clamp(3rem,5.5vw,5.6rem)] font-black leading-[0.95] text-white">
                <span className="block text-zinc-100">Hi，我是</span>
                <span className="mt-3 block text-sky-300">冯嘉斌</span>
              </h1>
              <p className="mb-4 text-base font-semibold text-zinc-100">产品经理 / 独立开发者</p>
              <p className="max-w-sm text-sm leading-7 text-zinc-400">
                2027 届暨南大学硕士，拥有阿里高德、WPS、SHEIN、唯品会、网易有道 5 段互联网实习经历。
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 36 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.12, ease: 'easeOut' }}
              className="relative z-10 flex h-[min(620px,120vw)] w-full items-end justify-center self-end overflow-hidden md:h-[560px] lg:h-[calc(90svh-9rem)]"
            >
              <div className="absolute left-1/2 top-[2%] w-full max-w-[560px] -translate-x-1/2 lg:max-w-none">
                <motion.img
                  src={publicAsset("justin-3d-v4.png")}
                  alt="冯嘉斌 3D 卡通形象"
                  drag="x"
                  dragConstraints={{ right: 16, left: -16 }}
                  dragElastic={0.08}
                  whileHover={{ scale: 1.012 }}
                  whileTap={{ cursor: 'grabbing' }}
                  className="relative z-10 block h-auto w-full cursor-grab select-none drop-shadow-[0_24px_36px_rgba(0,0,0,0.4)]"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
              className="relative z-20 md:col-span-2 md:w-full lg:col-span-1 lg:pb-8"
            >
              <div className="mb-5 flex items-center gap-3 font-mono text-[11px] uppercase text-sky-300">
                关于我
                <span className="h-px flex-1 bg-white/10" />
              </div>
              <h2 className="mb-5 max-w-lg text-3xl font-bold leading-tight text-white xl:text-4xl">
                理解用户，做好产品，<br className="hidden xl:block" />也做好生意。
              </h2>
              <div className="mb-6 flex flex-wrap gap-2">
                {['AI 产品', '用户洞察', '电商增长', '独立开发'].map((tag) => (
                  <span key={tag} className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-xs text-zinc-300">
                    {tag}
                  </span>
                ))}
              </div>
              <p className="mb-8 max-w-lg text-sm leading-7 text-zinc-400">
                我关注用户、产品与商业之间的连接。喜欢从真实场景和数据中发现问题，再把想法做成能体验、能验证、能持续迭代的产品。
              </p>

              <div className="grid grid-cols-3 border-y border-white/10 py-5">
                {[
                  { value: '5', unit: '段', label: '互联网实习' },
                  { value: '2', unit: '个', label: '创业实践' },
                  { value: '1', unit: '款', label: '上线 Agent' },
                ].map((item, index) => (
                  <div key={item.label} className={index > 0 ? 'border-l border-white/10 pl-4' : ''}>
                    <div className="text-2xl font-bold text-zinc-100">
                      {item.value}<span className="ml-1 text-xs font-normal text-zinc-500">{item.unit}</span>
                    </div>
                    <div className="mt-1 text-[11px] text-zinc-500">{item.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <nav className="grid shrink-0 grid-cols-4 border-t border-white/10" aria-label="页面导航">
            {[
              { label: '关于我', target: 'about-section' },
              { label: '实习经历', target: 'internships' },
              { label: '精选作品', target: 'projects' },
              { label: '创业实践', target: 'startup' },
            ].map((item, index) => (
              <button
                key={item.target}
                type="button"
                onClick={() => document.getElementById(item.target)?.scrollIntoView({ behavior: 'smooth' })}
                className={`group relative h-16 text-xs text-zinc-500 transition-colors hover:text-white ${index > 0 ? 'border-l border-white/10' : ''}`}
              >
                <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-700 transition-all group-hover:bg-sky-300 group-hover:shadow-[0_0_10px_rgba(125,211,252,0.8)]" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </section>

      {/* About Section */}
      <section id="about-section" className="relative z-10 px-5 py-14 md:px-8 md:py-16 xl:px-12">
        <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-12 lg:grid-cols-12 xl:gap-16">
          
          {/* Left: Sticky Profile */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-7">
              <div className="relative h-48 w-48 overflow-hidden rounded-2xl glass p-2">
                <img 
                  src="https://i.postimg.cc/S2MfBfpp/image.png"
                  alt="冯嘉斌个人头像"
                  className="w-full h-full object-cover rounded-xl transition-all duration-500"
                />
              </div>
              
              <div>
                <h2 className="mb-3 font-sans text-3xl font-bold leading-tight">关于我</h2>
                <p className="font-mono text-sm leading-7 text-zinc-400">
                  暨南大学硕士在读，华农双一流本科。正在探索 AI 与商业的边界，用 Vibe Coding 将想法转化为真实产品。具备大厂业务 sense 与独立开发落地能力。
                </p>
              </div>

              <div className="grid grid-cols-3 divide-x divide-zinc-800/50 pt-4 -mx-2">
                <div className="px-2">
                  <button 
                    onClick={() => document.getElementById('internships')?.scrollIntoView({ behavior: 'smooth' })}
                    className="w-full flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-zinc-800/40 hover:backdrop-blur-md border border-transparent hover:border-zinc-700/50 transition-all rounded-2xl py-3"
                  >
                    <div className="text-3xl font-bold font-sans text-sky-400 group-hover:text-sky-300 transition-colors">5<span className="text-sm text-zinc-500 font-normal ml-1">段</span></div>
                    <div className="text-xs text-zinc-400 mt-2 font-mono group-hover:text-zinc-300 transition-colors">实习经历</div>
                  </button>
                </div>
                <div className="px-2">
                  <button 
                    onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })}
                    className="w-full flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-zinc-800/40 hover:backdrop-blur-md border border-transparent hover:border-zinc-700/50 transition-all rounded-2xl py-3"
                  >
                    <div className="text-3xl font-bold font-sans text-sky-400 group-hover:text-sky-300 transition-colors">4<span className="text-sm text-zinc-500 font-normal ml-1">个</span></div>
                    <div className="text-xs text-zinc-400 mt-2 font-mono group-hover:text-zinc-300 transition-colors">开发项目</div>
                  </button>
                </div>
                <div className="px-2">
                  <button 
                    onClick={() => document.getElementById('startup')?.scrollIntoView({ behavior: 'smooth' })}
                    className="w-full flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-zinc-800/40 hover:backdrop-blur-md border border-transparent hover:border-zinc-700/50 transition-all rounded-2xl py-3"
                  >
                    <div className="text-3xl font-bold font-sans text-sky-400 group-hover:text-sky-300 transition-colors">2<span className="text-sm text-zinc-500 font-normal ml-1">个</span></div>
                    <div className="text-xs text-zinc-400 mt-2 font-mono group-hover:text-zinc-300 transition-colors">创业实践</div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Timeline */}
          <div className="lg:col-span-8">
            <h2 className="mb-8 font-sans text-3xl font-bold leading-tight md:mb-10">教育经历</h2>
            
            <div className="relative space-y-6 border-l border-zinc-800 pl-6 md:pl-8">
              {[
                { 
                  school: "暨南大学", 
                  degree: "国际商务 (市场营销)", 
                  time: "2024.09 - 2027.06", 
                  desc: "211 双一流高校硕士在读。专注于探索 AI 技术在商业与营销领域的应用边界。",
                  tags: ["211", "双一流", "硕士"]
                },
                { 
                  school: "华南农业大学", 
                  degree: "市场营销 / 金融学 (辅修)", 
                  time: "2020.09 - 2024.06", 
                  desc: "双一流高校本科毕业。具备扎实的商业理论基础与数据分析能力。",
                  tags: ["双一流", "本科", "双学位"]
                }
              ].map((edu, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 36 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  className="group glass relative rounded-2xl p-5 transition-colors hover:bg-white/5 md:p-6"
                >
                  <div className="absolute -left-[41px] top-6 w-4 h-4 rounded-full bg-zinc-900 border-2 border-zinc-700 group-hover:border-sky-400 group-hover:shadow-[0_0_10px_rgba(56,189,248,0.5)] transition-all duration-300" />
                  <div className="mb-3 flex flex-col justify-between gap-3 md:flex-row md:items-center">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-sans text-xl font-bold leading-tight">{edu.school}</h3>
                      <div className="flex flex-wrap gap-2">
                        {edu.tags.map(tag => (
                          <span key={tag} className="px-2 py-0.5 text-sm font-mono glass rounded-md text-zinc-400 border-zinc-700">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="w-fit shrink-0 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 font-mono text-sm text-sky-400">{edu.time}</span>
                  </div>
                  <div className="mb-3 font-mono text-sm leading-6 text-cyan-400">{edu.degree}</div>
                  <p className="font-mono text-sm leading-7 text-zinc-400">{edu.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Internships Section */}
      <section id="internships" className="relative z-10 px-5 md:px-8 xl:px-12">
        <div className="mx-auto max-w-[1600px] border-t border-zinc-800/50 py-14 md:py-16">
        <h2 className="mb-10 text-center font-sans text-3xl font-bold leading-tight md:mb-12">实习经历</h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {[
            {
              id: 'intern-amap',
              title: "阿里巴巴 · 高德",
              tag: "AI 产品经理实习生",
              time: "2026.06 - 至今",
              color: "#3b82f6",
              imageBg: "#f7f9fc",
              image: publicAsset("amap.ico"),
              desc: "面向客服质量治理，建设动作质量检测与 AI 数字员工产品闭环。",
              content: "业务问题：一线客服的服务承诺散落在非结构化会话中，后续是否履约缺少自动追踪；客服遇到系统异常时也高度依赖人工答疑与转交，处理链路长、承接效率不稳定。\n\n产品方案：① 动作质量检测：将客服承诺拆解为动作类型、对象、金额、时限和证据原句，串联识别、履约判断、超时预警与人工复核，让服务承诺可追踪；② AI 数字员工：围绕客服异常咨询设计“问题识别—知识答疑/工具排查—结果反馈—结构化转交”路径，减少客服在多个系统间反复确认。\n\n业务结果：承诺提取与期限识别准确率明显提升；AI 数字员工完成全路由覆盖，并有效提高 Agent 承接效率。",
            },
            { 
              id: 'intern-1',
              title: "金山 WPS", 
              tag: "C端AI产品实习生", 
              time: "2025.09 - 2026.02", 
              color: "#ef4444", // Red for WPS
              desc: "负责 AI PPT 基于私有知识库的“白盒化”生成链路重构。",
              content: "项目背景：随着 AI PPT 业务深入，用户核心诉求由“发散性一键生成”向“可控、可追溯的精准生成”演进。针对传统纯大模型生成容易产生幻觉、难以满足严谨职场与学术交付标准的痛点，项目旨在重构基于私有知识库的“白盒化”生成链路。\n\n需求评估：① 数据与场景验证：通过清洗大规模线上真实 Prompt 语料，发现非指令型需求占比较高，验证纯生成内容难以满足严谨工作与学业要求；进而明确学生与职场群体的场景差异，确立以私有知识为核心的生成基调；② 竞品分析：调研 Genflow、Genspark、IMA 等竞品，发现其存在过度发散的问题，从而确立白盒化生成的差异化竞争策略。\n\n业务结果：生成内容的可控性与可追溯性提升，幻觉风险降低。",
              image: "data:image/png;base64,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"
            },
            { 
              id: 'intern-2',
              title: "希音 SHEIN", 
              tag: "AI产品实习生", 
              time: "2024.12 - 2025.04", 
              color: "#ffffff", // White for SHEIN to make glow visible
              desc: "构建“AI外呼机器人+AI应用助手”智能触达体系。",
              content: "项目挑战：人工招商成本高，触达效率低，且传统外呼机器人话术死板，转化率低下。\n\n解决方案：设计 AI 外呼话术树，结合 LLM 进行意图识别与动态回复。针对不同品类的供应商，定制化生成沟通策略，并打通企业微信 API 实现自动添加好友与后续跟进。\n\n业务结果：触达效率与意向转化率均得到提升，单次触达成本明显降低。",
              image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAAAeFBMVEX///8AAADk5OQrKyteXl5DQ0NGRkY+Pj4dHR2cnJwkJCQ3Nzfy8vLHx8f29vZ2dnaVlZVYWFiCgoLr6+ulpaWNjY3b29t8fHyxsbHR0dFQUFBra2vMzMy5ublgYGCysrIXFxcwMDAYGBgLCwuhoaFvb2+Hh4e/v78YEvpGAAADxklEQVR4nO3aaXeiMBiG4cTiglgsBZdiXVpb/f//cKjsSdhq5zQz576+1SSGxwp5CQoBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD+L+t95K6e3O3j+rePxGjp3zd+f5AVsTsy9toGzk38orb4cdriLNWWMD44jYIPpfcua9hpc3tvpoj+Q2oetOfbnqQqfjT0c/NWrXGRt3hqy0h766pnpfd79vpZm3si5wtDwvyNpm35wtg4+UT/tvZIqM00LOE8e31mSCjf9W9WkXDcEnDdOL1rWUIptQ+9T8KwZf5X2xJqR9Qn4bh5ei3H7yeU18EJj7UJz9U/tAvmfQlnnu5hNTShjIYm9MpEm3VyPfbX2+D2l+G0vi+hdlabdCesv093wsp3qDyLR7vkSA2X5vsSPnWEu+mRUFb/790Jr8W42jm8j40VhB0J5aZ8tTthlPd46zO/JQllWfF0J/zIe8R95rclYXm03Qm3xaA+89uS8Cwn2VnUnfClGLVp6lJhS8KEl14JuxP65Rgn7JzfooTyFNaOv3k93FUGXboyFgnV4qmlxv/x9bCwFr0S1utuZ996n1kknASq7oTjzVLzqZbSQxJ+fc596tKVMmx3bQ7pyk4D61L16z4oYVKk9rp7CrSBS70itTOh3Is+CcVBHzm9Gntal1C6+aZAa0LjgcemnRr7EhbaE4qRYxgT6f1sSDiOjG/UkTC5pH7qg9S700rCs9q3eGHY/eFcPeO7E3pi/62EyZq91TaktDXahvXQE+LxewkTYaSEVFcrG2qar+3KstYcmPDreJ6qww5Kqy0JDfuDvROKyi1jQinjrEkowrzjdxKKxbQYd6y32JNQLCobTIMTVrZQL/UGixIKv74NOiyhKJZH5QGJTQmVcrM9oVaGFrdUVies3fm1JnyWy/rWYXG46qJvWUKx6Zfw9km41VumclXc1rvallBc+iTMv82f13Rp8I+z8pNRyu+7El7CkU7dVRiYUBTLd/M+TfWKNJscnGnlb+kovX/+yYy6/zU0YbFZ2JQw9Ayzln60ajMa/OxJe8i8b0/4ZJq1oN0/2Zgwq8Ob90vV6qdCvxmwMmFah7dcaRr/jUe9r50Jb3V422qxuJimDlp3Mf5awvw6ftLmzi+BD4bjCt87ahr/qO63Hcy7bdEs/fXKSbsDXpyz37VoT3hGWYvRTH0GPM4a9B+PrDYpdUQ6/bz11ya3kK/RczD2kvf2glXLjqmtfP0nRgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4N/zB0sLNZL+MHcIAAAAAElFTkSuQmCC"
            },
            { 
              id: 'intern-3',
              title: "唯品会", 
              tag: "活动运营实习生", 
              time: "2024.06 - 2024.09", 
              color: "#ec4899", // Pink for VIP
              imageBg: "#e4007f", // Correct VIP.com brand pink
              desc: "协助策划执行 SVIP 会员“私享特卖”核心业务。",
              content: "项目挑战：高净值用户对常规促销疲劳，活跃度与复购率出现瓶颈。\n\n解决方案：打造稀缺感与尊享感，引入限量尖货与专属客服。通过 RFM 模型筛选目标用户，进行精准的短信与 Push 推送。策划“SVIP 内购会”等线上活动，提升用户参与感。\n\n业务结果：活动期间 SVIP 活跃度与客单价均有提升，整体 GMV 超预期达成。",
              image: "data:image/png;base64,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"
            },
            { 
              id: 'intern-4',
              title: "网易", 
              tag: "广告实习生", 
              time: "2024.01 - 2024.05", 
              color: "#ef4444", // Red for Netease
              imageBg: "#f6f6f6", // Correct Netease logo background color
              desc: "负责多款海外社交产品的广告投放策略与数据监控体系搭建。",
              content: "工作内容：\n1. 负责海外社交产品在 Meta、Google Ads 等渠道的买量投放，优化 CPA 与 ROI。\n2. 搭建自动化数据监控看板，实时追踪广告素材的点击率与转化率，及时调整出价策略。\n3. 与设计团队协作，产出高转化率的视频与图文素材，进行 A/B 测试。\n\n业务结果：整体获客成本降低，核心产品 MAU 提升。",
              image: "data:image/png;base64,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"
            }
          ].map((intern, i) => (
            <motion.div
              key={intern.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1 }}
            >
              <WorkCard 
                project={{
                  ...intern,
                  cardImageClass: 'opacity-70 group-hover:opacity-95',
                  cardOverlayClass: 'from-[#050505] via-[#050505]/50 to-transparent',
                  cardSizeClass: 'h-[380px] sm:h-[400px] xl:h-[400px] 2xl:h-[420px]',
                }} 
                onClick={() => setSelectedProject(intern)} 
              />
            </motion.div>
          ))}
        </div>
        </div>
      </section>

      {/* Work Section */}
      <section id="projects" className="relative z-10 px-5 md:px-8 xl:px-12">
        <div className="mx-auto max-w-[1600px] border-t border-zinc-800/50 py-14 md:py-16">
        <h2 className="mb-10 text-center font-sans text-3xl font-bold leading-tight md:mb-12">精选作品</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:gap-7">
          {projects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1 }}
            >
              <WorkCard 
                project={{
                  ...project,
                  cardImageClass: 'opacity-70 group-hover:opacity-95',
                  cardOverlayClass: 'from-[#050505] via-[#050505]/50 to-transparent',
                }} 
                onClick={() => setSelectedProject(project)} 
              />
            </motion.div>
          ))}
        </div>
        </div>
      </section>

      {/* Startup Section */}
      <section id="startup" className="relative z-10 px-5 md:px-8 xl:px-12">
        <div className="mx-auto max-w-[1600px] border-t border-zinc-800/50 py-14 md:py-16">
        <h2 className="mb-10 text-center font-sans text-3xl font-bold leading-tight md:mb-12">创业实践</h2>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:gap-7">
          {startupProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.1 }}
            >
              <WorkCard
                project={project}
                onClick={() => setSelectedProject(project)}
              />
            </motion.div>
          ))}
        </div>
        </div>
      </section>

      {/* Contact Modal */}
      <AnimatePresence>
        {contactOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 p-5 backdrop-blur-xl"
            onClick={() => setContactOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="contact-dialog-title"
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-[#0a0a0a] p-6 shadow-2xl sm:p-8"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                aria-label="关闭联系方式"
                onClick={() => setContactOpen(false)}
                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-7 pr-12">
                <div className="mb-2 font-mono text-xs tracking-widest text-sky-400">联系方式</div>
                <h2 id="contact-dialog-title" className="text-2xl font-bold text-white">联系冯嘉斌</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-500">欢迎交流 AI 产品、电商增长与合作机会。</p>
              </div>

              <div className="space-y-3">
                {[
                  { type: 'phone' as const, label: '电话', value: '13727750948', display: '137 2775 0948', Icon: Phone },
                  { type: 'email' as const, label: '邮箱', value: '2290200191@qq.com', display: '2290200191@qq.com', Icon: Mail },
                ].map(({ type, label, value, display, Icon }) => (
                  <div key={type} className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-400/10 text-sky-300">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1 text-left">
                      <div className="text-xs text-zinc-600">{label}</div>
                      <div className="truncate font-mono text-sm text-zinc-200">{display}</div>
                    </div>
                    <button
                      type="button"
                      aria-label={`复制${label}`}
                      onClick={() => copyContact(type, value)}
                      className="flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-full border border-zinc-700 px-3 text-xs text-zinc-400 transition-colors hover:border-sky-400/50 hover:text-sky-300"
                    >
                      {copiedContact === type ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      <span>{copiedContact === type ? '已复制' : '复制'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Project Modal */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-start justify-center overflow-x-hidden overflow-y-auto bg-black/80 p-2 backdrop-blur-xl sm:p-4 md:items-center md:p-12"
            onClick={() => setSelectedProject(null)}
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative my-2 w-full max-w-5xl overflow-hidden rounded-xl border border-zinc-800 bg-[#0a0a0a] shadow-2xl sm:my-4 sm:rounded-3xl md:my-auto"
              onClick={e => e.stopPropagation()}
            >
              <button 
                className="glass absolute right-3 top-3 z-20 flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-white/10 sm:right-6 sm:top-6"
                onClick={() => setSelectedProject(null)}
              >
                <X className="w-6 h-6 text-white" />
              </button>
              
              <div 
                className="relative h-52 w-full sm:h-64 md:h-96"
                style={{ backgroundColor: selectedProject.imageBg || 'white' }}
              >
                <img 
                  src={selectedProject.image} 
                  alt={selectedProject.title}
                  className={`w-full h-full ${selectedProject.imageFit === 'cover' ? `object-cover ${selectedProject.imagePosition === 'top' ? 'object-top' : 'object-center'}` : 'object-contain p-4 pb-16 md:p-8 md:pb-20'}`}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
              </div>

              <div className="relative z-10 -mt-14 min-w-0 p-5 sm:-mt-20 sm:p-8 md:p-12">
                <h2 className="mb-4 break-words font-sans text-[clamp(1.9rem,9vw,3rem)] font-bold leading-tight">{selectedProject.title}</h2>
                {selectedProject.link ? (
                  <a
                    href={selectedProject.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-7 flex w-full min-w-0 items-center gap-3 rounded-xl border border-white/15 bg-white/[0.05] px-4 py-3 font-mono text-base font-bold leading-tight transition-colors hover:border-white/30 hover:bg-white/[0.1] sm:mb-8 sm:w-fit sm:max-w-full sm:rounded-2xl sm:px-5 sm:text-2xl md:text-4xl"
                    style={{ color: selectedProject.color }}
                  >
                    <ExternalLink className="h-5 w-5 shrink-0 sm:h-7 sm:w-7 md:h-10 md:w-10" />
                    <span className="min-w-0 break-all">{selectedProject.linkLabel || selectedProject.link}</span>
                  </a>
                ) : (
                  <div className="mb-8 font-mono text-sm tracking-widest" style={{ color: selectedProject.color }}>
                    {selectedProject.tag}
                  </div>
                )}
                
                <div className="prose prose-invert max-w-none">
                  <p className="mb-7 break-words font-mono text-base leading-8 text-zinc-300 sm:mb-8 sm:text-xl">
                    {selectedProject.desc}
                  </p>
                  
                  <div className="glass space-y-6 rounded-xl p-4 sm:rounded-2xl sm:p-8">
                    {selectedProject.isStartup ? (
                      selectedProject.startupType === 'aiootd' ? (
                        <div className="space-y-12">
                          <div className="border-y border-zinc-800/70 py-8">
                            <div className="mb-3 font-mono text-xs text-purple-400">AI 每日穿搭</div>
                            <h4 className="max-w-3xl text-2xl font-bold leading-tight text-zinc-100 sm:text-3xl md:text-4xl">
                              今天穿什么，问一句就有答案。
                            </h4>
                            <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-400">
                              AIOOTD 是一款懂你衣橱的 AI 穿搭助手。导入自己的衣服，即可获得结合天气、场合与个人风格的整套搭配，并在专属模特上预览上身效果。
                            </p>
                          </div>

                          <div className="space-y-5">
                            <div className="font-mono text-xs text-purple-400">核心功能</div>
                            <div className="grid gap-px overflow-hidden rounded-lg border border-zinc-800 bg-zinc-800 md:grid-cols-2">
                              {[
                                { title: 'AI 电子衣橱', text: '批量上传衣物照片，自动识别品类、颜色和风格，把散落的衣服变成随时可用的数字衣橱。' },
                                { title: '场景化穿搭推荐', text: '通勤、约会、旅行或临时降温，直接说出需求，获得结合天气与个人偏好的整套方案。' },
                                { title: '专属模特虚拟试穿', text: '将搭配穿到自己的专属模特上，提前确认整体效果，让选择更直观。' },
                                { title: '穿搭日历与收藏', text: '记录每日穿搭、收藏满意方案，让好搭配持续复用，也让闲置衣物重新被看见。' },
                              ].map((item) => (
                                <div key={item.title} className="bg-[#0a0a0a] p-6">
                                  <h5 className="mb-3 text-lg font-semibold text-zinc-100">{item.title}</h5>
                                  <p className="text-sm leading-6 text-zinc-500">{item.text}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-6">
                            <div className="font-mono text-xs text-purple-400">产品预览</div>
                            <div className="grid gap-5 md:grid-cols-2">
                              {[
                                { src: publicAsset('aiootd-recommendation.jpg'), caption: '整套搭配一屏呈现，单品组合与整体风格清晰可见' },
                                { src: publicAsset('aiootd-tryon.jpg'), caption: '专属模特虚拟试穿，搭配效果先看再穿' },
                              ].map((image) => (
                                <button
                                  key={image.src}
                                  type="button"
                                  className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 text-left"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setZoomedImage(image.src);
                                  }}
                                >
                                  <img src={image.src} alt={image.caption} className="aspect-[4/3] w-full object-cover object-top" loading="lazy" />
                                  <span className="block px-4 py-3 text-xs leading-5 text-zinc-500">{image.caption}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-5">
                            <div className="font-mono text-xs text-purple-400">为什么选择 AIOOTD</div>
                            <div className="grid gap-6 md:grid-cols-3">
                              {[
                                { title: '基于你的真实衣橱', text: '推荐优先使用你已经拥有的衣服，不只是提供遥远的穿搭灵感。' },
                                { title: '可以继续聊、继续改', text: '不满意就换颜色、换单品或换场合，搭配会跟着你的反馈继续调整。' },
                                { title: '越用越懂你的风格', text: '持续记住偏好与历史穿搭，让每一次推荐更贴近真实的你。' },
                              ].map((item) => (
                                <div key={item.title}>
                                  <h5 className="mb-2 font-semibold text-zinc-200">{item.title}</h5>
                                  <p className="text-sm leading-6 text-zinc-500">{item.text}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                      <div className="space-y-12">
                        <div className="border-y border-zinc-800/70 py-8">
                          <div className="mb-3 font-mono text-xs text-sky-400">泰国男装店铺</div>
                          <h4 className="max-w-3xl text-3xl font-bold leading-tight text-zinc-100 md:text-4xl">
                            从一间店铺，跑通跨境电商经营闭环。
                          </h4>
                          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-400">
                            独立完成泰国市场男装店铺的选品、商品上架、内容生产、促销配置与数据复盘，用真实交易验证经营判断。
                          </p>
                        </div>

                        <div className="space-y-5">
                          <div className="flex flex-wrap items-end justify-between gap-3">
                            <div className="font-mono text-xs text-sky-400">经营概览</div>
                            <span className="text-[11px] text-zinc-600">截至 2026.10 · 数据已取整并脱敏</span>
                          </div>
                          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-zinc-800 bg-zinc-800 md:grid-cols-4">
                            {[
                              { value: '฿38K+', label: '累计 GMV' },
                              { value: '200+', label: '商品成交件数' },
                              { value: '30K+', label: '高潜单品曝光' },
                              { value: '8.7%', label: '高潜单品点击率' },
                            ].map((item) => (
                              <div key={item.label} className="bg-[#0a0a0a] p-6">
                                <div className="mb-2 text-2xl font-bold text-sky-400 md:text-3xl">{item.value}</div>
                                <div className="text-xs text-zinc-500">{item.label}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-5">
                          <div className="font-mono text-xs text-sky-400">我的经营动作</div>
                          <div className="grid gap-px overflow-hidden rounded-lg border border-zinc-800 bg-zinc-800 md:grid-cols-2">
                            {[
                              { title: '垂类选品', text: '聚焦泰国市场的美式复古与工装男装，通过多款商品的小规模测试，持续判断款式、价格带与内容表现。' },
                              { title: '本地化内容', text: '围绕商品卖点制作试穿与场景内容，并完成泰语文案、配音和商品视觉适配，提高内容生产与上新效率。' },
                              { title: '促销增长', text: '组合秒杀与优惠券测试转化，其中秒杀贡献近九成促销 GMV，成为当前更有效的成交杠杆。' },
                              { title: '数据复盘', text: '按曝光、点击和成交拆解单品表现，识别 30K+ 曝光、2.6K+ 点击的高潜商品，再反推选品和素材迭代。' },
                            ].map((item) => (
                              <div key={item.title} className="bg-[#0a0a0a] p-6">
                                <h5 className="mb-3 text-lg font-semibold text-zinc-100">{item.title}</h5>
                                <p className="text-sm leading-6 text-zinc-500">{item.text}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-5">
                          <div className="font-mono text-xs text-sky-400">增长闭环</div>
                          <div className="grid grid-cols-1 items-center gap-3 rounded-lg border border-zinc-800 px-5 py-7 text-center sm:grid-cols-[1fr_auto_1fr_auto_1fr]">
                            <div>
                              <div className="font-semibold text-zinc-200">选品测试</div>
                              <div className="mt-1 text-xs text-zinc-600">款式与价格带</div>
                            </div>
                            <ArrowRight className="mx-auto h-4 w-4 rotate-90 text-zinc-600 sm:rotate-0" />
                            <div>
                              <div className="font-semibold text-zinc-200">内容获客</div>
                              <div className="mt-1 text-xs text-zinc-600">曝光与点击</div>
                            </div>
                            <ArrowRight className="mx-auto h-4 w-4 rotate-90 text-zinc-600 sm:rotate-0" />
                            <div>
                              <div className="font-semibold text-zinc-200">促销成交</div>
                              <div className="mt-1 text-xs text-zinc-600">转化与复盘</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      )
                    ) : (
                      <>
                        <h3 className="text-2xl font-bold font-sans">项目详情</h3>
                        <div className="text-zinc-400 leading-relaxed font-mono text-sm whitespace-pre-line space-y-4">
                          {selectedProject.content}
                        </div>

                        {selectedProject.detailImages && selectedProject.detailImages.length > 0 && (
                          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-zinc-800/50">
                            {selectedProject.detailImages.map((img: any, idx: number) => (
                              <div 
                                key={idx} 
                                className={`flex flex-col items-center space-y-3 ${img.layout === 'half' ? 'col-span-1' : 'col-span-1 md:col-span-2'}`}
                              >
                                <div className="w-full rounded-xl overflow-hidden border border-zinc-800/50 bg-zinc-900/30">
                                  <img 
                                    src={img.url} 
                                    alt={img.caption} 
                                    className="w-full h-auto object-contain cursor-zoom-in hover:opacity-80 transition-opacity"
                                    loading="lazy"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setZoomedImage(img.url);
                                    }}
                                  />
                                </div>
                                <p className="text-zinc-500 text-xs font-mono text-center">
                                  {img.caption}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    {selectedProject.link && (
                      <div className="pt-6 mt-6 border-t border-zinc-800/50">
                        <a 
                          href={selectedProject.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-mono text-sm rounded-full transition-colors"
                        >
                          访问项目 <ArrowRight className="w-4 h-4" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Zoom Modal */}
      <AnimatePresence>
        {zoomedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setZoomedImage(null);
              setTimeout(() => setZoomScale(1), 300);
            }}
            onWheel={(e) => {
              e.stopPropagation();
              setZoomScale(prev => Math.min(Math.max(0.5, prev - e.deltaY * 0.005), 5));
            }}
            className="fixed inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 cursor-zoom-out overflow-hidden"
            style={{ zIndex: 9999 }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setZoomedImage(null);
                setTimeout(() => setZoomScale(1), 300);
              }}
              className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              style={{ zIndex: 10000 }}
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: zoomScale, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              src={zoomedImage}
              alt="放大预览"
              className={`max-w-full max-h-full object-contain rounded-lg shadow-2xl ${zoomScale > 1 ? 'cursor-grab active:cursor-grabbing' : ''}`}
              onClick={(e) => e.stopPropagation()}
              drag
              dragConstraints={{ left: -2000, right: 2000, top: -2000, bottom: 2000 }}
              dragElastic={0.1}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
