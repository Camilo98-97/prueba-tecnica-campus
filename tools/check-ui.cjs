// Browser acceptance tests against API fixtures. Run Angular first.
// Requires Playwright and Edge. BASE_URL defaults to http://localhost:4200.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    const names = ['Matemáticas','Estadística','Programación','Bases de datos','Física','Electrónica','Comunicación','Literatura','Inglés','Emprendimiento'];
    const teachers = ['Laura Méndez','Carlos Rojas','Diana Torres','Andrés Ruiz','Sofía Castro'];
    const courses = names.map((name,i) => ({id:i+1,name,credits:3,professorId:Math.floor(i/2)+1,professorName:teachers[Math.floor(i/2)]}));
    let profile = null; let loggedIn = false; let enrollmentAttempts = 0; let profileWrites = 0;
    await page.route('**/api/**', async route => {
      const req=route.request(); const path=new URL(req.url()).pathname; const method=req.method();
      const reply=(data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
      if(method!=='GET') assert.equal(req.headers()['x-campus-request'],'1');
      if(path==='/api/courses') return reply(courses);
      if(path==='/api/auth/register') {
        const input=req.postDataJSON(); assert.equal(input.courseIds,undefined);
        profile={id:1,name:input.name,email:input.email,courses:[],totalCredits:0}; loggedIn=true; return reply(profile,201);
      }
      if(path==='/api/auth/login') {
        if(req.postDataJSON().password!=='Campus123!') return reply({detail:'Correo o contraseña incorrectos.'},401);
        loggedIn=true; return reply(profile);
      }
      if(!loggedIn) return reply({},401);
      if(path==='/api/auth/logout') { loggedIn=false; return route.fulfill({status:204}); }
      if(path==='/api/students/me' && method==='GET') return reply(profile);
      if(path==='/api/students/me' && method==='PUT') {
        const input=req.postDataJSON(); assert.equal(input.courseIds,undefined); profileWrites++;
        profile={...profile,...input}; return reply(profile);
      }
      if(path==='/api/students/me' && method==='DELETE') { loggedIn=false; profile=null; return route.fulfill({status:204}); }
      if(path==='/api/students/me/enrollment') {
        const input=req.postDataJSON(); assert.deepEqual([...input.courseIds].sort(),[1,3,5]);
        enrollmentAttempts++;
        if(enrollmentAttempts===1) return reply({detail:'No se pudo guardar. Inténtalo nuevamente.'},503);
        profile={...profile,courses:courses.filter(c=>input.courseIds.includes(c.id)),totalCredits:9}; return reply(profile);
      }
      if(path==='/api/students/me/classes') return reply(profile.courses.map(c=>({...c,classmates:c.id===1?[{name:'Luis López'}]:[]})));
      if(path==='/api/students') return reply([{id:1,name:profile.name,courses:profile.courses.map(c=>c.name)},{id:2,name:'Luis López',courses:['Matemáticas','Bases de datos','Electrónica']}]);
      return reply({},404);
    });
    const base=process.env.BASE_URL || 'http://localhost:4200';
    fs.mkdirSync('docs/screenshots',{recursive:true});
    await page.goto(base+'/panel/mis-materias');
    await page.waitForURL('**/login');
    await page.getByRole('button',{name:'Iniciar sesión',exact:true}).waitFor();
    assert.equal(await page.locator('.course-card').count(),0);
    await page.screenshot({path:'docs/screenshots/login.png',fullPage:true,animations:'disabled'});
    await page.getByRole('link',{name:'Regístrate',exact:true}).click();
    await page.getByLabel('Nombre completo').fill('Ana Pérez');
    await page.getByLabel('Correo electrónico').fill('ana@example.com');
    await page.getByLabel('Contraseña',{exact:true}).fill('Campus123!');
    await page.getByLabel('Confirma tu contraseña').fill('diferente');
    await page.getByLabel('Correo electrónico').click();
    assert.equal(await page.getByRole('button',{name:'Crear mi cuenta'}).isDisabled(),true);
    await page.getByLabel('Confirma tu contraseña').fill('Campus123!');
    await page.getByRole('button',{name:'Crear mi cuenta'}).click();
    await page.waitForURL('**/panel/inscripcion');
    await page.locator('.course-card').first().waitFor();
    assert.equal(await page.locator('.course-card').count(),10);
    await page.getByRole('navigation').getByRole('link',{name:/Mis materias/}).click();
    await page.getByText('Tu semestre está por comenzar.').waitFor();
    await page.locator('a[href="/panel/inscripcion"]', { hasText: 'Elegir mis materias' }).click();
    await page.getByRole('button',{name:'Seleccionar Matemáticas',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('button[aria-label="Seleccionar Estadística"]').disabled);
    assert.equal(await page.getByRole('button',{name:'Confirmar inscripción'}).isDisabled(),true);
    page.once('dialog',dialog=>dialog.dismiss());
    await page.getByRole('navigation').getByRole('link',{name:'Inicio',exact:true}).click();
    assert.match(page.url(),/inscripcion/);
    await page.getByRole('button',{name:'Seleccionar Programación',exact:true}).click();
    await page.getByRole('button',{name:'Seleccionar Física',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('.credit-total strong')?.textContent==='9');
    await page.locator('#main-content').focus();
    await page.locator('.skip-link').evaluate(element => element.style.display = 'none');
    await page.screenshot({path:'docs/screenshots/desktop.png',fullPage:true,animations:'disabled'});
    await page.locator('.skip-link').evaluate(element => element.style.removeProperty('display'));
    await page.getByRole('button',{name:'Confirmar inscripción'}).click();
    await page.getByText('No se pudo guardar. Inténtalo nuevamente.').waitFor();
    assert.equal(await page.locator('.course-card.is-selected').count(),3);
    await page.getByRole('button',{name:'Confirmar inscripción'}).click();
    await page.waitForURL('**/panel/mis-materias');
    await page.locator('.registered-card').first().waitFor();
    assert.equal(await page.locator('.registered-card').count(),3);
    await page.locator('.registered-card').first().locator('summary').click();
    await page.locator('.classmates li').filter({hasText:'Luis López'}).waitFor();
    await page.screenshot({path:'docs/screenshots/mis-materias.png',fullPage:true,animations:'disabled'});
    await page.reload();
    await page.locator('.registered-card').first().waitFor();
    assert.equal(await page.locator('.registered-card').count(),3);
    await page.getByRole('navigation').getByRole('link',{name:'Comunidad',exact:true}).click();
    await page.getByLabel('Buscar estudiante').fill('Luis');
    await page.waitForFunction(()=>document.querySelectorAll('tbody tr').length===1 && document.querySelector('tbody')?.textContent.includes('Luis'));
    await page.getByRole('navigation').getByRole('link',{name:'Mi perfil',exact:true}).click();
    await page.getByLabel('Nombre completo').fill('Ana Actualizada');
    await page.getByRole('button',{name:'Guardar perfil',exact:true}).click();
    await page.getByText('Tu perfil se actualizó correctamente.').waitFor();
    assert.equal(profileWrites,1); assert.equal(profile.courses.length,3);
    await page.getByRole('navigation').getByRole('link',{name:'Inicio',exact:true}).click();
    await page.getByRole('heading',{name:'Hola, Ana.'}).waitFor();
    await page.screenshot({path:'docs/screenshots/inicio.png',fullPage:true,animations:'disabled'});
    await page.setViewportSize({width:390,height:844});
    for(const target of ['Inicio','Inscribir materias','Mis materias','Comunidad','Mi perfil']) {
      await page.getByRole('navigation').getByRole('link',{name:target==='Mis materias'?/Mis materias/:new RegExp('^'+target+'$')}).click();
      await page.locator('main h1').waitFor();
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,target+' mobile overflow');
    }
    await page.getByRole('navigation').getByRole('link',{name:/Mis materias/}).click();
    await page.locator('.registered-card').first().waitFor();
    await page.screenshot({path:'docs/screenshots/mobile.png',fullPage:true,animations:'disabled'});
    await page.getByRole('button',{name:'Cerrar sesión'}).click();
    await page.waitForURL('**/login');
    await page.getByLabel('Correo electrónico').fill('ana@example.com');
    await page.getByLabel('Contraseña',{exact:true}).fill('incorrecta');
    await page.getByRole('button',{name:'Iniciar sesión',exact:true}).click();
    await page.getByText('Correo o contraseña incorrectos.').waitFor();
    await page.getByLabel('Contraseña',{exact:true}).fill('Campus123!');
    await page.getByRole('button',{name:'Iniciar sesión',exact:true}).click();
    await page.waitForURL('**/panel/inicio');
    // Simulate session expiry and verify protected routes return to login.
    loggedIn=false;
    await page.getByRole('navigation').getByRole('link',{name:'Comunidad',exact:true}).click();
    await page.waitForURL('**/login');
    await page.getByText('Tu sesión terminó. Ingresa nuevamente.').waitFor();
    assert.deepEqual(errors,[]);
    console.log('PASS: route guards, registration without courses, empty state, selection rules, unsaved guard, save retry, enrollment, classmates, reload, search, independent profile, mobile layouts, login/logout and expiry. API fixtures used.');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exit(1)});

