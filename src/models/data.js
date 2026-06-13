export const meta = {
  name: 'Falgun Marothia',
  title: 'Project Engineer, CDAC',
  location: 'Chennai, Tamil Nadu',
  origin: 'Kishangarh, Ajmer, Rajasthan',
  email: 'fmfalgunmarothia@gmail.com',
  github: 'https://github.com/fmfalgun',
  linkedin: 'https://www.linkedin.com/in/falgun-marothia-52a383191/',
  resume: 'falgun_resume.pdf',
  siteUrl: 'https://fmfalgun.github.io',
};

export const projects = [
  {
    id: 'ble-monitor',
    protocol: 'BLE',
    status: 'active',
    title: 'BLE Security Monitor POC',
    desc: 'End-to-end BLE attack lab — ESP32 clients, Raspberry Pi 5 GATT server ("VictimDevice"), Adafruit nRF52840 sniffer. Generates labeled pcap datasets across attack types: scan flooding, advertisement flooding, connection flooding, and spoofed advertisements. Feeds an ML-based IDS pipeline with integer-labeled records.',
    tags: ['BLE SMP', 'Scapy', 'BlueZ', 'ML/IDS', 'Dataset Gen'],
  },
  {
    id: 'zigbee-lab',
    protocol: 'ZIGBEE',
    status: 'active',
    title: 'Zigbee Attack Lab',
    desc: "Zigbee security research using Sonoff CC2652P against a KillerBee-informed threat model (ZB-01 through ZB-04). Covers replay attacks, spoofing, and key extraction scenarios. Part of a multi-protocol attack dataset generation pipeline under CDAC's Zero Trust IoT security module.",
    tags: ['KillerBee', 'CC2652P', '802.15.4', 'Replay Attack'],
  },
  {
    id: 'wifi-dataset',
    protocol: 'Wi-Fi',
    status: 'complete',
    title: 'Wi-Fi Management Frame Attack Dataset',
    desc: 'Generated labeled datasets for Wi-Fi management frame attacks on ESP32 / Raspberry Pi infrastructure. Trained XGBoost and Random Forest classifiers for anomaly detection. Foundational dataset work that informed the multi-protocol IDS architecture at CDAC.',
    tags: ['802.11', 'XGBoost', 'Random Forest', 'ESP32', 'tshark'],
  },
  {
    id: 'aura',
    protocol: 'MULTI',
    status: 'research',
    title: 'AURA — Autonomous Red-team Unified Agent',
    desc: 'Research roadmap for an autonomous red-team agent covering distribution-shift robustness, continual learning, cross-protocol foundation models, and safety-constrained autonomy. Explores AI-driven penetration testing across heterogeneous IoT protocol stacks.',
    tags: ['LLM Agent', 'Continual Learning', 'Red-team', 'Multi-protocol'],
  },
  {
    id: 'zero-trust',
    protocol: 'INFRA',
    status: 'active',
    title: 'Zero Trust Smart-Home Security Architecture',
    desc: 'Formal threat modeling report using STRIDE and Data Flow Diagrams for a 3-layer Zero Trust smart-home architecture covering Wi-Fi, BLE, and Zigbee. Microsegmentation policies, per-protocol security modules, and attack surface enumeration.',
    tags: ['STRIDE', 'DFD', 'Zero Trust', 'Microsegmentation'],
  },
  {
    id: 'proxmox-lab',
    protocol: 'SYS',
    status: 'active',
    title: 'Proxmox Home Security Lab',
    desc: 'Self-hosted Proxmox VE home lab with Ubuntu Server and Kali Linux VMs for IoT attack research. Cockpit and Netdata for system monitoring. Dedicated dataset capture and protocol analysis environment.',
    tags: ['Proxmox', 'Kali Linux', 'Netdata', 'Home Lab'],
  },
];

export const skills = [
  {
    category: 'WIRELESS PROTOCOLS',
    items: [
      'Wi-Fi (802.11) — Management Frame Attacks',
      'Bluetooth / BLE — GATT Security',
      'ZigBee (IEEE 802.15.4)',
      'LoRa / LoRaWAN',
      'IoT Device Security',
    ],
  },
  {
    category: 'SECURITY RESEARCH',
    items: [
      'Vulnerability Assessment & Penetration Testing (VAPT)',
      'Network Security / Internet Security',
      'Ethical Hacking',
      'Anomaly Detection / Continuous Monitoring',
      'Social Engineering',
      'CTF',
    ],
  },
  {
    category: 'AUTH & CRYPTOGRAPHY',
    items: [
      'Kerberos — Authentication Protocol',
      'Blockchain-Based Authentication',
      'Hyperledger Fabric',
      'Asymmetric Cryptography / RSA',
      'Cryptography',
      'OpenZiti / Zero Trust',
    ],
  },
  {
    category: 'PROGRAMMING',
    items: [
      'Python · C · C++ · Go',
      'JavaScript · Node.js · PHP',
      'Bash · Fish · Scripting',
      'Competitive Programming',
    ],
  },
  {
    category: 'SYSTEMS & TOOLS',
    items: [
      'Kali Linux · Arch Linux · Ubuntu',
      'Docker · Git · GitHub',
      'Linux Server / OS Administration',
      'Scapy / tshark / Wireshark',
      'Joplin',
    ],
  },
  {
    category: 'WEB & FULL-STACK',
    items: [
      'HTML / HTML5 / CSS',
      'Bootstrap',
      'Full-Stack Development',
      'Application Security',
    ],
  },
];

export const publications = [
  {
    year: '2026',
    title: 'Reliable Authentication of IoT Using Kerberos and Blockchain',
    venue: 'Springer',
    date: 'Feb 1, 2026',
    desc: 'Upgraded Kerberos authentication system integrating blockchain to overcome centralised single-point failure and scalability limitations. Proposes decentralised authentication via symmetric-to-asymmetric cryptography migration with fault-tolerant mechanism. Includes formal mathematical proof and comparative analysis against existing IoT authentication methods.',
    tags: ['Springer', 'Kerberos', 'Blockchain', 'IoT Auth'],
    placeholder: false,
  },
  {
    year: '2025',
    title: 'A Comprehensive Survey on Zero Trust Architecture in IoT Networks',
    venue: 'IEEE',
    date: 'Dec 16, 2025',
    desc: 'In-depth analysis of Zero Trust Architecture (ZTA) adoption in IoT environments. Evaluates ZT principles — continuous authentication, least privilege, micro-segmentation, continuous monitoring — against IoT constraints. Reviews AI/ML-driven anomaly detection and future directions in lightweight cryptography and autonomous policy orchestration.',
    tags: ['IEEE', 'Zero Trust', 'IoT Security', 'Survey'],
    placeholder: false,
  },
];
