/* ---------- Development Modal ---------- */
const devModal = document.getElementById('devModal');
const closeModalBtn = document.getElementById('closeModal');
const dismissModalBtn = document.getElementById('dismissModal');
const devModalOverlay = document.getElementById('devModalOverlay');

if (closeModalBtn && dismissModalBtn) {
  const closeModal = () => {
    devModal.classList.add('hidden');
    localStorage.setItem('devModalClosed', 'true');
  };

  closeModalBtn.addEventListener('click', closeModal);
  dismissModalBtn.addEventListener('click', closeModal);
  devModalOverlay.addEventListener('click', closeModal);

  // Check if modal was previously closed
  if (localStorage.getItem('devModalClosed') === 'true') {
    devModal.classList.add('hidden');
  }
}

/* ---------- Collapsible sidebar for small screens ---------- */
const toggleBtn = document.getElementById('toggleSidebar');
const sidebarContent = document.getElementById('sidebarContent');

if (toggleBtn) {
  toggleBtn.addEventListener('click', () => {
    const hidden = sidebarContent.getAttribute('aria-hidden') === 'true';
    sidebarContent.setAttribute('aria-hidden', hidden ? 'false' : 'true');
    toggleBtn.setAttribute('aria-expanded', hidden ? 'true' : 'false');
    toggleBtn.textContent = hidden ? 'Hide' : 'Show';
  });
}

/* ---------- Specialization switching + knowledge generation ---------- */
const specializationSelect = document.getElementById('specialization');
const projectGrid = document.getElementById('projectGrid');
const domainTags = document.getElementById('domainTags');
const conceptTags = document.getElementById('conceptTags');
const toolTags = document.getElementById('toolTags');
const knowledgeEmpty = document.getElementById('knowledgeEmpty');
const trainingList = document.getElementById('trainingList');
const downloadCvBtn = document.getElementById('download-cv'); // <-- your CV button link

const TRAINING_BY_SPEC = {
  'cloud': [
    'Launched EC2/Linux VM and secured SSH (key-based auth, ufw).',
    'Configured S3 static hosting and CloudFront distribution.',
    'Wrote basic IaC snippets (AWS CLI / user data) and deployment notes.',
  ],
  'cybersecurity': [
    'Built a Wazuh SIEM lab and tuned basic rules.',
    'Practiced packet capture and log analysis (tcpdump/Wireshark).',
    'Hardened Linux services with firewall rules and least-privilege users.',
  ],
  'it-support': [
    'Resolved simulated tickets (account lockout, printer setup, Wi-Fi issues).',
    'Documented SOPs for password resets and on-boarding.',
    'Performed AD user lifecycle tasks in a lab (create/disable, groups).',
  ],
};

const TRAINING_LINKS_BY_SPEC = {
  'cloud': {
    'Launched EC2/Linux VM and secured SSH (key-based auth, ufw).': 'blogs/building-a-cross-cloud-data-pipeline.html',
    'Configured S3 static hosting and CloudFront distribution.': 'blogs/weaponizing-public-buckets.html',
    'Wrote basic IaC snippets (AWS CLI / user data) and deployment notes.': 'blogs/weaponizing-public-buckets.html',
  },
  'cybersecurity': {
    'Built a Wazuh SIEM lab and tuned basic rules.': 'projects/iptables-firewall-setup.html',
    'Practiced packet capture and log analysis (tcpdump/Wireshark).': 'projects/iptables-firewall-setup.html',
    'Hardened Linux services with firewall rules and least-privilege users.': 'blogs/building-a-cross-cloud-data-pipeline.html',
  },
  'it-support': {
    'Resolved simulated tickets (account lockout, printer setup, Wi-Fi issues).': 'blogs/powershell-onboarding-scripts-in-a-hybrid-ad-azure-environment.html',
    'Documented SOPs for password resets and on-boarding.': 'blogs/secret-management-in-aws-secrets-manager-vs.-google-secret-manager.html',
    'Performed AD user lifecycle tasks in a lab (create/disable, groups).': 'blogs/powershell-onboarding-scripts-in-a-hybrid-ad-azure-environment.html',
  },
};function getUrlParameter(name) {
  name = name.replace(/[[]/, '\\[').replace(/[\]]/, '\\]');
  const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  const results = regex.exec(location.search);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// chip limits
const DOMAIN_LIMIT = 5;
const CONCEPT_LIMIT = 5;
const TOOL_LIMIT = 7;

function renderList(el, items) {
  el.innerHTML = '';
  items.forEach(txt => {
    const li = document.createElement('li');
    li.textContent = txt;
    el.appendChild(li);
  });
}

function renderTrainingList(el, spec) {
  el.innerHTML = '';
  const items = TRAINING_BY_SPEC[spec] || [];
  const links = TRAINING_LINKS_BY_SPEC[spec] || {};
  
  items.forEach(description => {
    const li = document.createElement('li');
    const href = links[description];
    
    if (href) {
      const a = document.createElement('a');
      a.href = href;
      a.textContent = description;
      li.appendChild(a);
    } else {
      li.textContent = description;
    }
    
    el.appendChild(li);
  });
}

function slugifyTag(tag) {
  return tag
    .toLowerCase()
    .replace(/\s+/g, '-')    // spaces to dashes
    .replace(/[^\w\-]/g, ''); // remove non-alphanumeric except dash
}

// helper: render chips with counts + see all
function renderChips(container, freqMap, kind, limit) {
  container.innerHTML = '';

  // sort by frequency desc, then alphabetically
  const sorted = Object.entries(freqMap)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  const showAll = sorted.length > limit;

  function render(isExpanded) {
    container.innerHTML = '';
    const items = isExpanded ? sorted : sorted.slice(0, limit - 1);

    // render chips
    items.forEach(([label, count]) => {
      const link = document.createElement('a');
      link.href = `./tags/${slugifyTag(label)}.html`;
      link.className = 'chip';
      link.dataset.kind = kind;
      // Only show count if it's greater than 1
      link.textContent = count > 1 ? `${label} (${count})` : label;
      container.appendChild(link);
    });

    // add toggle chip if needed
    if (showAll) {
      const toggleChip = document.createElement('a');
      toggleChip.href = '#';
      toggleChip.className = 'chip see-all';
      toggleChip.dataset.kind = kind;
      toggleChip.textContent = isExpanded ? 'Show less' : 'Show all';
      toggleChip.addEventListener('click', (e) => {
        e.preventDefault();
        render(!isExpanded); // toggle
      });
      container.appendChild(toggleChip);
    }
  }

  render(false); // default collapsed
}

function updatePortfolioStats(spec) {
  /**
   * Update portfolio stats display based on current specialization
   * Reads data-portfolio-stats from portfolioStats element and updates stat values
   */
  const portfolioStats = document.getElementById('portfolioStats');
  if (!portfolioStats) return;
  
  const statsData = portfolioStats.dataset.portfolioStats;
  if (!statsData) {
    console.warn('[updatePortfolioStats] No stats data found');
    return;
  }
  
  try {
    const stats = JSON.parse(statsData);
    const specStats = stats[spec] || { project: 0, lab: 0, writeup: 0 };
    
    // Update stat values
    const projectStat = document.querySelector('[data-type="project"]');
    const labStat = document.querySelector('[data-type="lab"]');
    const writeupStat = document.querySelector('[data-type="writeup"]');
    
    if (projectStat) projectStat.textContent = specStats.project || 0;
    if (labStat) labStat.textContent = specStats.lab || 0;
    if (writeupStat) writeupStat.textContent = specStats.writeup || 0;
    
    console.log(`[updatePortfolioStats] Updated for ${spec}: ${specStats.project} projects, ${specStats.lab} labs, ${specStats.writeup} writeups`);
  } catch (e) {
    console.warn('[updatePortfolioStats] Failed to parse stats data:', e);
  }
}

function updateView() {
  const spec = specializationSelect.value;
  console.log(`[updateView] Switching to specialization: ${spec}`);

  // Filter projects and update descriptions
  const cards = Array.from(projectGrid.querySelectorAll('.project'));
  let visibleCount = 0;
  
  cards.forEach(card => {
    const specAttr = card.dataset.specialization;
    // Cards with no specialization are shown in all views
    const specs = specAttr ? specAttr.split(" ") : [spec];
    const show = specs.includes(spec);
    card.style.display = show ? '' : 'none';
    
    // Update description for this specialization if available
    if (show) {
      const specDescriptions = card.dataset.specDescriptions;
      if (specDescriptions) {
        try {
          const descMap = JSON.parse(specDescriptions);
          const descElement = card.querySelector('.card-description');
          if (descElement && descMap[spec]) {
            descElement.textContent = descMap[spec];
          }
        } catch (e) {
          console.warn(`[updateView] Failed to parse spec descriptions:`, e);
        }
      }
      
      // Update tags visibility based on spec
      const tagSpecsMap = card.dataset.tagSpecs;
      if (tagSpecsMap) {
        try {
          const tagsSpec = JSON.parse(tagSpecsMap);
          const tagElements = card.querySelectorAll('.chip[data-tag]');
          tagElements.forEach(tagEl => {
            const tagName = tagEl.dataset.tag;
            const tagSpecs = tagsSpec[tagName];
            // Show tag if: it includes current spec OR it includes 'global'
            if (tagSpecs && (tagSpecs.includes(spec) || tagSpecs.includes('global'))) {
              tagEl.style.display = '';
            } else {
              tagEl.style.display = 'none';
            }
          });
        } catch (e) {
          console.warn(`[updateView] Failed to parse tag specs:`, e);
        }
      }
    }
    
    if (show) visibleCount++;
  });

  console.log(`[updateView] Visible cards: ${visibleCount}`);

  // Sort visible cards by their spec-specific ranking
  const visibleCards = cards.filter(card => card.style.display !== 'none');
  visibleCards.sort((cardA, cardB) => {
    const rankingsA = cardA.dataset.specRankings;
    const rankingsB = cardB.dataset.specRankings;
    
    let rankA = 0;
    let rankB = 0;
    
    if (rankingsA) {
      try {
        const ranksA = JSON.parse(rankingsA);
        rankA = ranksA[spec] || 0;
      } catch (e) {
        console.warn(`[updateView] Failed to parse rankings for card A:`, e);
      }
    }
    
    if (rankingsB) {
      try {
        const ranksB = JSON.parse(rankingsB);
        rankB = ranksB[spec] || 0;
      } catch (e) {
        console.warn(`[updateView] Failed to parse rankings for card B:`, e);
      }
    }
    
    // Sort descending (highest rank first)
    return rankB - rankA;
  });
  
  // Reorder cards in DOM based on sorted order
  visibleCards.forEach(card => {
    projectGrid.appendChild(card);
  });

  // Collect frequency maps from visible cards only (only visible tags)
  const domains = {};
  const concepts = {};
  const tools = {};

  visibleCards.forEach(card => {
    // Only count visible tags
    card.querySelectorAll('.chip[data-tag]').forEach(chip => {
      if (chip.style.display !== 'none') {
        const kind = chip.dataset.kind;
        const text = chip.textContent.trim();
        if (kind === 'domain') domains[text] = (domains[text] || 0) + 1;
        if (kind === 'concept') concepts[text] = (concepts[text] || 0) + 1;
        if (kind === 'tool') tools[text] = (tools[text] || 0) + 1;
      }
    });
  });

  // render chips with limits
  renderChips(domainTags, domains, 'domain', DOMAIN_LIMIT);
  renderChips(conceptTags, concepts, 'concept', CONCEPT_LIMIT);
  renderChips(toolTags, tools, 'tool', TOOL_LIMIT);

  knowledgeEmpty.style.display = visibleCount === 0 ? '' : 'none';

  // Practical training - now with links from spec files
  renderTrainingList(trainingList, spec);

  // Update Portfolio Stats for current specialization
  updatePortfolioStats(spec);

  // Update CV view link
  if (downloadCvBtn) { //Specialized CV filename: `Ryan_Jamilosa_${spec}_resume_2026.pdf` 
    const filename = `Ryan_Jamilosa_resume_2026.pdf`;
    downloadCvBtn.dataset.cvPath = `./cv/${filename}`;
  }
  
  console.log(`[updateView] Complete`);
}

// Check for URL parameter on page load
document.addEventListener('DOMContentLoaded', () => {
  const specParam = getUrlParameter('spec');
  if (specParam && specializationSelect.querySelector(`option[value="${specParam}"]`)) {
    specializationSelect.value = specParam;
  }
  updateView();
});

specializationSelect.addEventListener('change', updateView);

/* ---------- CV Modal Popup Handler ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const cvModal = document.getElementById('cvModal');
  const cvFrame = document.getElementById('cvFrame');
  const cvModalClose = document.getElementById('cvModalClose');
  const cvBtn = document.getElementById('download-cv');
  
  // Open modal
  if (cvBtn) {
    cvBtn.addEventListener('click', () => {
      const cvPath = cvBtn.dataset.cvPath;
      if (cvPath) {
        cvFrame.src = cvPath;
        cvModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
      }
    });
  }
  
  // Close modal - close button
  if (cvModalClose) {
    cvModalClose.addEventListener('click', () => {
      cvModal.style.display = 'none';
      document.body.style.overflow = 'auto';
      cvFrame.src = '';
    });
  }
  
  // Close modal - click outside
  if (cvModal) {
    cvModal.addEventListener('click', (e) => {
      if (e.target === cvModal.querySelector('.cv-modal-overlay')) {
        cvModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        cvFrame.src = '';
      }
    });
  }
  
  // Close modal - ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cvModal && cvModal.style.display !== 'none') {
      cvModal.style.display = 'none';
      document.body.style.overflow = 'auto';
      cvFrame.src = '';
    }
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const halo = document.createElement('div');
  halo.className = 'cursor-halo';
  document.body.appendChild(halo);

  document.addEventListener('mousemove', (e) => {
    halo.style.left = `${e.clientX}px`;
    halo.style.top = `${e.clientY}px`;
  });

  // Hide halo when mouse leaves window
  document.addEventListener('mouseleave', () => {
    halo.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    if (window.innerWidth > 980) {
      halo.style.opacity = '0.3';
    }
  });
});