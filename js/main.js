const menuBtn = document.querySelector('.hamburger');
const menuBar = document.querySelector('.menu-bar');
const menuList = document.querySelector('.nav-menu');

menuBtn.addEventListener('click', showMenu);

function showMenu(){
    menuBtn.classList.toggle('is-active');
    menuBar.classList.toggle('is-active');
    menuList.classList.toggle('is-active');
}
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    let mouseX = 0;
    let mouseY = 0;
    let prevMouseX = 0;
    let prevMouseY = 0;

    class Particle {
    constructor(x, y, mouseVelX, mouseVelY, type) {
    this.x = x;
    this.y = y;
    this.type = type; // 'star' or 'cube'

    // Calculate perpendicular direction (like boat wake)
    const perpAngle = Math.atan2(mouseVelY, mouseVelX) + (Math.PI / 2);
    const side = Math.random() > 0.5 ? 1 : -1;
    const spreadAngle = perpAngle * side + (Math.random() - 0.5) * 0.8;

    const speed = Math.random() * 1.5 + 0.5;
    this.velocityX = Math.cos(spreadAngle) * speed;
    this.velocityY = Math.sin(spreadAngle) * speed;

    this.size = Math.random() * 3 + 2;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.1;
    this.life = 1;
    this.decay = Math.random() * 0.012 + 0.008;
}

    update() {
    this.x += this.velocityX;
    this.y += this.velocityY;
    this.rotation += this.rotationSpeed;
    this.life -= this.decay;
    this.velocityX *= 0.96;
    this.velocityY *= 0.96;
}

    draw() {
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    if (this.type === 'star') {
    // Draw star
    const spikes = 4;
    const outerRadius = this.size;
    const innerRadius = this.size * 0.4;

    // Glow
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, outerRadius * 2);
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.6)');
    gradient.addColorStop(0.5, 'rgba(5, 150, 105, 0.3)');
    gradient.addColorStop(1, 'rgba(4, 120, 87, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, outerRadius * 2, 0, Math.PI * 2);
    ctx.fill();

    // Star shape
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i * Math.PI) / spikes;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
}
    ctx.closePath();
    ctx.fill();

} else {
    // Draw cube (diamond shape)
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size * 2);
    gradient.addColorStop(0, 'rgba(52, 211, 153, 0.6)');
    gradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.3)');
    gradient.addColorStop(1, 'rgba(5, 150, 105, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, this.size * 2, 0, Math.PI * 2);
    ctx.fill();

    // Diamond/cube
    ctx.fillStyle = '#34d399';
    ctx.beginPath();
    ctx.moveTo(0, -this.size);
    ctx.lineTo(this.size, 0);
    ctx.lineTo(0, this.size);
    ctx.lineTo(-this.size, 0);
    ctx.closePath();
    ctx.fill();

    // Inner detail
    ctx.fillStyle = '#6ee7b7';
    ctx.beginPath();
    ctx.moveTo(0, -this.size * 0.5);
    ctx.lineTo(this.size * 0.5, 0);
    ctx.lineTo(0, this.size * 0.5);
    ctx.lineTo(-this.size * 0.5, 0);
    ctx.closePath();
    ctx.fill();
}

    ctx.restore();
}
}

    function createParticles(x, y, velX, velY) {
    // Only create particle if there's movement
    if (Math.abs(velX) > 0.5 || Math.abs(velY) > 0.5) {
    const type = Math.random() > 0.5 ? 'star' : 'cube';
    particles.push(new Particle(x, y, velX, velY, type));
}
}

    function animate() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].draw();

    if (particles[i].life <= 0) {
    particles.splice(i, 1);
}
}

    requestAnimationFrame(animate);
}

    let lastTime = Date.now();
    document.addEventListener('mousemove', (e) => {
    const currentTime = Date.now();

    prevMouseX = mouseX || e.clientX;
    prevMouseY = mouseY || e.clientY;
    mouseX = e.clientX;
    mouseY = e.clientY;

    const velX = mouseX - prevMouseX;
    const velY = mouseY - prevMouseY;

    // Fewer particles - only spawn every 60ms
    if (currentTime - lastTime > 60) {
    createParticles(mouseX, mouseY, velX, velY);
    lastTime = currentTime;
}
});

    window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

    animate();
