const produkList = {
    "1gb": { name: "Panel 1GB", price: 30, ram: 1024, cpu: 50, disk: 5000 },
    "2gb": { name: "Panel 2GB", price: 5000, ram: 2048, cpu: 60, disk: 7000 },
    "7gb": { name: "Panel 7GB", price: 9000, ram: 4096, cpu: 80, disk: 10000 },
    "3gb": { name: "Panel 3gb", price: 30000, ram: 0, cpu: 0, disk: 0 },
    "4gb": { name: "Panel 4GB", price: 30, ram: 1024, cpu: 50, disk: 5000 },
    "5gb": { name: "Panel 5GB", price: 5000, ram: 2048, cpu: 60, disk: 7000 },
    "6gb": { name: "Panel 6GB", price: 9000, ram: 4096, cpu: 80, disk: 10000 },
    "unli": { name: "Panel Unlimited", price: 30000, ram: 0, cpu: 0, disk: 0 },
  };
  
  const global = {
    api: "https://simpelz.fahriofficial.my.id",
    key: "new2025",
    merchantIdOrderKuota: "OK2142306",
    apiOrderKuota: "700336617360840832142306OKCT7A1A4292BE20CEF492B467C5B6EAC103",
    qrisOrderKuota: "00020101021126670016COM.NOBUBANK.WWW01189360050300000879140214520146378043870303UMI51440014ID.CO.QRIS.WWW0215ID20243618270230303UMI5204541153033605802ID5919STOK RESS OK21423066007CILEGON61054241162070703A016304F736",
    domainV2: "https://mikudevprivate.pteropanelku.biz.id",
    apikeyV2: "ptla_7gss1IvRmWISvixYyZ4fEQgPD6wLvakmAeZMyoT9HFQ",
    nestid: 1,
    eggV2: 17,
    locV2: 1
  };
  
  const urlParams = new URLSearchParams(window.location.search);
  const username = urlParams.get("username");
  const ramKey = urlParams.get("ram");
  const selectedProduct = produkList[ramKey];
  
  if (!username || !selectedProduct) {
    document.body.innerHTML = "<h2>Data tidak valid.</h2>";
    throw new Error("Invalid data");
  }
  
  const totalAmount = selectedProduct.price;
  
  const qrisImg = document.getElementById("qris-img");
  const statusEl = document.getElementById("status");
  const akunPanelEl = document.getElementById("akun-panel");
  
  fetch(`${global.api}/api/orkut/createpayment?apikey=${global.key}&amount=${totalAmount}&codeqr=${global.qrisOrderKuota}`)
    .then(res => res.json())
    .then(data => {
      if (data.result && data.result.qrImageUrl) {
        qrisImg.src = data.result.qrImageUrl;
        startCountdown(5 * 60);
  
        const polling = setInterval(async () => {
          const res = await fetch(`${global.api}/api/orkut/cekstatus?apikey=${global.key}&merchant=${global.merchantIdOrderKuota}&keyorkut=${global.apiOrderKuota}`);
          const status = await res.json();
          if (parseInt(status?.data?.amount) === totalAmount) {
            clearInterval(polling);
            statusEl.innerText = "Pembayaran diterima. Mengatur akun panel...";
  
            await buatAkunPanel(username, selectedProduct);
          }
        }, 7000);
  
        setTimeout(() => {
          clearInterval(polling);
          statusEl.innerText = "QRIS kadaluarsa.";
        }, 300000);
      } else {
        alert("Gagal membuat QR.");
      }
    });
  
  function startCountdown(durasi) {
    const countdown = document.getElementById("countdown");
    let waktu = durasi;
    const timer = setInterval(() => {
      const m = Math.floor(waktu / 60);
      const s = waktu % 60;
      countdown.textContent = `QR akan kadaluarsa dalam: ${m}:${s.toString().padStart(2, '0')}`;
      if (--waktu < 0) clearInterval(timer);
    }, 1000);
  }
  
  async function buatAkunPanel(username, Obj) {
    let name = username.charAt(0).toUpperCase() + username.slice(1) + " Server";
    let email = username + "@gmail.com";
    let password = username + "001";
  
    let userRes = await fetch(`${global.domainV2}/api/application/users`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": "Bearer " + global.apikeyV2
      },
      body: JSON.stringify({
        email,
        username,
        first_name: name,
        last_name: "Server",
        language: "en",
        password
      })
    });
    let user = await userRes.json();
    if (user.errors) return alert("Gagal membuat akun panel.");
  
    let eggData = await (await fetch(`${global.domainV2}/api/application/nests/${global.nestid}/eggs/${global.eggV2}`, {
      headers: {
        "Authorization": "Bearer " + global.apikeyV2
      }
    })).json();
  
    let serverRes = await fetch(`${global.domainV2}/api/application/servers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + global.apikeyV2
      },
      body: JSON.stringify({
        name,
        user: user.attributes.id,
        egg: global.eggV2,
        docker_image: "ghcr.io/parkervcp/yolks:nodejs_18",
        startup: eggData.attributes.startup,
        environment: {
          INST: "npm",
          USER_UPLOAD: "0",
          AUTO_UPDATE: "0",
          CMD_RUN: "npm start"
        },
        limits: {
          memory: Obj.ram,
          swap: 0,
          disk: Obj.disk,
          io: 500,
          cpu: Obj.cpu
        },
        feature_limits: {
          databases: 5,
          backups: 5,
          allocations: 5
        },
        deploy: {
          locations: [global.locV2],
          dedicated_ip: false,
          port_range: []
        }
      })
    });
  
    let server = await serverRes.json();
    if (server.errors) return alert("Gagal membuat server.");
  
    akunPanelEl.classList.remove("hidden");
    akunPanelEl.innerHTML = `
      <h3>Data Akun Panel:</h3>
      <p><b>Username:</b> ${username}</p>
      <p><b>Password:</b> ${password}</p>
      <p><b>RAM:</b> ${Obj.ram == 0 ? "Unlimited" : Obj.ram / 1024 + " GB"}</p>
      <p><b>CPU:</b> ${Obj.cpu == 0 ? "Unlimited" : Obj.cpu + "%"}</p>
      <p><b>Disk:</b> ${Obj.disk == 0 ? "Unlimited" : Obj.disk / 1000 + " GB"}</p>
      <p><b>Panel Login:</b> ${global.domainV2}</p>
    `;
  }