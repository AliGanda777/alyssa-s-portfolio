const supportsIntersectionObserver = typeof window !== 'undefined' && 'IntersectionObserver' in window;
const observer = supportsIntersectionObserver
  ? new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    )
  : null;

const revealElement = (el) => {
  if (!el) return;
  if (observer) {
    observer.observe(el);
  } else {
    el.classList.add('visible');
  }
};

// Observe all reveal types
document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach((el) => {
  revealElement(el);
});

// Stagger project cards with alternating slide directions
document.querySelectorAll('.project-category').forEach((category) => {
  category.querySelectorAll('.project-card').forEach((el, i) => {
    el.classList.add(i % 2 === 0 ? 'reveal' : 'reveal-scale');
    el.style.setProperty('--reveal-delay', `${i * 120}ms`);
    revealElement(el);
  });
});

// Leadership cards slide from alternating sides
document.querySelectorAll('.leadership-card').forEach((el, i) => {
  el.classList.add(i % 2 === 0 ? 'reveal-left' : 'reveal-right');
  el.style.setProperty('--reveal-delay', `${(i % 2) * 150}ms`);
  revealElement(el);
});

// Tool cards stagger with scale effect
document.querySelectorAll('.tool-card').forEach((el, i) => {
  el.classList.add('reveal-scale');
  el.style.setProperty('--reveal-delay', `${(i % 5) * 60}ms`);
  revealElement(el);
});

// Category titles slide from left
document.querySelectorAll('.category-title').forEach((el) => {
  el.classList.add('reveal-left');
  revealElement(el);
});

// Section headings
document.querySelectorAll('.section-heading').forEach((el) => {
  el.classList.add('reveal');
  revealElement(el);
});

// Contact section
document.querySelectorAll('.contact-inner, .contact-box').forEach((el) => {
  el.classList.add('reveal');
  revealElement(el);
});

// Quote
document.querySelectorAll('.quote-box').forEach((el) => {
  el.classList.add('reveal-scale');
  revealElement(el);
});

// Glitter background tracking
const glitterBackground = document.querySelector('.glitter-background');
let windowWidth  = window.innerWidth;
let windowHeight = window.innerHeight;

if (glitterBackground) {
  document.addEventListener('mousemove', function (e) {
    const xPct    = (e.clientX / windowWidth)  * 100;
    const yPct    = (e.clientY / windowHeight) * 100;
    const offsetX = (e.clientX - windowWidth  / 2) * 0.02;
    const offsetY = (e.clientY - windowHeight / 2) * 0.02;
    glitterBackground.style.backgroundPosition =
      `calc(${xPct}% + ${offsetX}px) calc(${yPct}% + ${offsetY}px)`;
    glitterBackground.style.transform =
      `translate(${offsetX * 0.5}px, ${offsetY * 0.5}px)`;
  });
}

// Update dimensions on resize
window.addEventListener('resize', () => {
  windowWidth = window.innerWidth;
  windowHeight = window.innerHeight;
});

// ─── Falling dots rain – tracks mouse movement direction ─────────────────────
(function () {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;';
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');
  let W = canvas.width  = window.innerWidth;
  let H = canvas.height = window.innerHeight;

  // Mouse position + velocity
  let mouseX = W / 2, mouseY = H / 2;
  let prevX  = W / 2, prevY  = H / 2;
  let mdx = 0, mdy = 0;   // mouse movement delta this frame

  window.addEventListener('resize', () => {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  });

  document.addEventListener('mousemove', e => {
    prevX  = mouseX;  prevY  = mouseY;
    mouseX = e.clientX; mouseY = e.clientY;
    mdx = mouseX - prevX;   // direction + magnitude of mouse movement
    mdy = mouseY - prevY;
  });

  const COUNT = 90;
  const dots = Array.from({ length: COUNT }, () => ({
    x:       Math.random() * window.innerWidth,
    y:       Math.random() * window.innerHeight,
    r:       2 + Math.random() * 3,
    baseVy:  0.8 + Math.random() * 1.8,
    vx:      0,
    vy:      0,
    opacity: 0.18 + Math.random() * 0.4,
  }));
  dots.forEach(d => { d.vy = d.baseVy; });

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const dark = document.body.classList.contains('dark-mode');
    const moving = Math.hypot(mdx, mdy) > 0.5;

    dots.forEach(d => {
      // When mouse is moving, push dots in the SAME direction as the mouse
      if (moving) {
        const dx   = mouseX - d.x;
        const dy   = mouseY - d.y;
        const dist = Math.hypot(dx, dy) || 1;
        const maxR = 260;
        if (dist < maxR) {
          const falloff = (1 - dist / maxR);
          d.vx += mdx * falloff * 0.12;
          d.vy += mdy * falloff * 0.12;
        }
      }

      // Restore natural fall speed; damp horizontal drift
      d.vy += (d.baseVy - d.vy) * 0.05;
      d.vx *= 0.92;

      d.x += d.vx;
      d.y += d.vy;

      if (d.x < -d.r)    d.x = W + d.r;
      if (d.x > W + d.r) d.x = -d.r;
      if (d.y > H + d.r) {
        d.y = -d.r * 2;
        d.x = Math.random() * W;
        d.vx = 0; d.vy = d.baseVy;
      }

      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = dark
        ? `rgba(255, 180, 200, ${d.opacity * 0.7})`
        : `rgba(225, 63, 102, ${d.opacity})`;
      ctx.fill();
    });

    // Decay mouse delta each frame so effect fades when mouse stops
    mdx *= 0.8;
    mdy *= 0.8;

    requestAnimationFrame(draw);
  }

  draw();
}());

// ─── Word-by-word About text animation ───────────────────────────────────────
(function () {
  document.querySelectorAll('.about-p').forEach(p => {
    p.innerHTML = p.textContent.trim().split(/\s+/).map(
      w => `<span class="word">${w}</span>`
    ).join(' ');
  });

  if (supportsIntersectionObserver) {
    const wordObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const words = entry.target.querySelectorAll('.word');
        words.forEach((w, i) => {
          setTimeout(() => w.classList.add('visible'), i * 35);
        });
        wordObserver.unobserve(entry.target);
      });
    }, { threshold: 0.25 });

    document.querySelectorAll('.about-p').forEach(p => wordObserver.observe(p));
  } else {
    document.querySelectorAll('.about-p .word').forEach(word => word.classList.add('visible'));
  }
}());

// ─── Sticky header shadow on scroll ──────────────────────────────────────────
(function () {
  const header = document.querySelector('.site-header');
  if (!header) return;
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });
}());

window.addEventListener('DOMContentLoaded', () => {
  // Theme toggle functionality
  const themeToggle = document.querySelector('.theme-toggle');

  // Check for saved theme preference or default to light mode
  let currentTheme = 'light';
  try {
    currentTheme = localStorage.getItem('theme') || 'light';
  } catch (_error) {
    currentTheme = 'light';
  }
  document.body.classList.toggle('dark-mode', currentTheme === 'dark');
  updateThemeIcon(currentTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDark = document.body.classList.toggle('dark-mode');
      const newTheme = isDark ? 'dark' : 'light';
      try {
        localStorage.setItem('theme', newTheme);
      } catch (_error) {
        // Ignore storage failures (private mode / blocked storage)
      }
      updateThemeIcon(newTheme);
    });
  }

  function updateThemeIcon(theme) {
    const iconContainer = document.querySelector('.theme-icon');
    if (!iconContainer) return;
    if (theme === 'dark') {
      iconContainer.innerHTML = `
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor"/>
      `;
    } else {
      iconContainer.innerHTML = `
        <circle cx="12" cy="12" r="5" fill="currentColor"/>
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      `;
    }
  }

  // Button hover effects
  document.querySelectorAll('.button').forEach((btn) => {
    btn.addEventListener('mouseenter', () => btn.classList.add('hovered'));
    btn.addEventListener('mouseleave', () => btn.classList.remove('hovered'));
  });

  // Floating object animation
  const floatingObject = document.querySelector('.floating-object');
  if (floatingObject) {
    let angle = 0;
    const radius = 30;
    const centerX = 50;
    const centerY = 50;

    function animateFloatingObject() {
      angle += 0.02;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      floatingObject.style.transform = `translate(${x - 50}%, ${y - 50}%) rotate(${angle * 10}deg)`;
      requestAnimationFrame(animateFloatingObject);
    }

    animateFloatingObject();
  }

  // 3D robot tracks mouse – stays in place, dance animation keeps playing
  const robotViewer = document.getElementById('robot-viewer');
  if (robotViewer) {
    const baseTheta = 0;
    const basePhi = 85;
    const radius = 14;
    const maxTheta = 45;
    const maxPhiOffset = 15;

    let targetTheta = baseTheta;
    let targetPhi = basePhi;
    let currentTheta = baseTheta;
    let currentPhi = basePhi;

    window.addEventListener('mousemove', (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      targetTheta = baseTheta - nx * maxTheta;
      targetPhi = basePhi - ny * maxPhiOffset;
    });

    function updateRobotCamera() {
      currentTheta += (targetTheta - currentTheta) * 0.05;
      currentPhi += (targetPhi - currentPhi) * 0.05;
      robotViewer.cameraOrbit = `${currentTheta}deg ${currentPhi}deg ${radius}m`;
      requestAnimationFrame(updateRobotCamera);
    }
    updateRobotCamera();
  }

  // Contact form submission
  const contactForm = document.getElementById('contact-form');
  const sendBtn = document.getElementById('send-btn');
  if (contactForm && sendBtn) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Get form data
      const formData = new FormData(contactForm);
      const message = formData.get('message') || '';
      const email = formData.get('email') || 'visitor@portfolio.local';

      // Show loading state
      const originalText = sendBtn.textContent;
      sendBtn.textContent = 'Sending...';
      sendBtn.disabled = true;

      try {
        // Send via Web3Forms
        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_key: 'bb7e7c91-48e0-49ad-bfeb-6e8f00e76d32',
            email: email,
            message: message,
            to_email: 'alyssacayabyab@gmail.com',
            from_name: 'Portfolio Contact',
            subject: 'New Message from Your Portfolio',
          })
        });

        const data = await response.json();

        if (data.success) {
          alert("Message sent successfully! I'll get back to you soon.");
          contactForm.reset();
          document.getElementById('contact-message').value = '';
        } else {
          alert('Failed to send. Please try again or contact directly.');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Error sending message. Please try again.');
      } finally {
        sendBtn.textContent = originalText;
        sendBtn.disabled = false;
      }
    });
  }
});
