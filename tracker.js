const fs = require('fs');
const path = require('path');

class FAANGTracker {
  constructor() {
    this.planPath = path.join(__dirname, 'plan.json');
    this.progressPath = path.join(__dirname, 'progress.json');
    this.plan = this.loadPlan();
    this.progress = this.loadProgress();
  }

  loadPlan() {
    try {
      return JSON.parse(fs.readFileSync(this.planPath));
    } catch {
      return this.createDefaultPlan();
    }
  }

  createDefaultPlan() {
    const defaultPlan = {/* ... (keep existing plan.json structure) ... */ };
    fs.writeFileSync(this.planPath, JSON.stringify(defaultPlan, null, 2));
    return defaultPlan;
  }

  loadProgress() {
    try {
      return JSON.parse(fs.readFileSync(this.progressPath));
    } catch {
      return this.createDefaultProgress();
    }
  }

  createDefaultProgress() {
    const defaultProgress = {
      startDate: new Date().toISOString(),
      currentMonth: 1,
      stats: {
        js: { lc: 0, projects: 0, hours: 0 },
        cpp: { lc: 0, projects: 0, hours: 0 },
        design: 0,
        mocks: 0
      },
      projects: [],
      dailyLog: {}
    };
    fs.writeFileSync(this.progressPath, JSON.stringify(defaultProgress, null, 2));
    return defaultProgress;
  }

  getCurrentMonth() {
    const start = new Date(this.progress.startDate);
    const diffMonths = Math.floor(
      (new Date() - start) / (30 * 24 * 60 * 60 * 1000)
    );
    return Math.min(diffMonths + 1, 12);
  }

  showTasks() {
    const month = this.getCurrentMonth() - 1;
    const { focus, daily, resources } = this.plan.months[month];

    console.log(`\n📅 Month ${month + 1} Focus: ${focus}`);
    console.log("📝 Daily Targets:");
    console.table(daily);
    console.log("📚 Recommended Resources:");
    console.table(resources);
  }

  logProgress(type, data) {
    const today = new Date().toISOString().split('T')[0];

    if (!this.progress.dailyLog[today]) {
      this.progress.dailyLog[today] = { tasks: [] };
    }

    this.progress.dailyLog[today].tasks.push({
      type,
      data,
      timestamp: new Date().toISOString()
    });

    // Update stats
    switch (type) {
      case 'lc':
        this.progress.stats[data.lang].lc += data.count;
        break;
      case 'project':
        const lang = data.lang;
        const hours = data.hours || 1;
        const projectName = data.name;
        const completed = data.completed;

        // Update language hours
        this.progress.stats[lang].hours += hours;

        // Find or create project
        let project = this.progress.projects.find(p => p.name === projectName);
        if (!project) {
          project = {
            name: projectName,
            lang: lang,
            hours: 0,
            completed: false
          };
          this.progress.projects.push(project);
        }

        // Update project details
        project.hours += hours;
        if (completed) {
          project.completed = true;
          this.progress.stats[lang].projects += 1;
        }
        break;
      case 'design':
        this.progress.stats.design += 1;
        break;
      case 'mock':
        this.progress.stats.mocks += 1;
        break;
    }

    fs.writeFileSync(this.progressPath, JSON.stringify(this.progress, null, 2));
    console.log("✅ Progress logged successfully!");
  }

  showStats() {
    console.log("\n📊 Current Statistics");
    console.log("⌛ Elapsed Months:", this.getCurrentMonth());

    console.log("\n💻 Language Stats:");
    console.table({
      JavaScript: this.progress.stats.js,
      CPlusPlus: this.progress.stats.cpp
    });

    console.log("\n🔨 Projects:");
    const projectTable = this.progress.projects.map(p => ({
      Name: p.name,
      Language: p.lang,
      Hours: p.hours,
      Completed: p.completed ? '✅' : '⏳'
    }));
    console.table(projectTable);

    console.log("\n🎯 Other Stats:");
    console.table({
      'System Designs': this.progress.stats.design,
      'Mock Interviews': this.progress.stats.mocks
    });
  }

  generateReport() {
    const report = [
      "# FAANG Preparation Progress Report",
      `**Start Date**: ${this.progress.startDate}`,
      `**Current Month**: ${this.getCurrentMonth()}`,
      "## Language Progress",
      "### JavaScript",
      `- LeetCode Solved: ${this.progress.stats.js.lc}`,
      `- Projects Completed: ${this.progress.stats.js.projects}`,
      `- Hours Invested: ${this.progress.stats.js.hours}`,
      "### C++",
      `- LeetCode Solved: ${this.progress.stats.cpp.lc}`,
      `- Projects Completed: ${this.progress.stats.cpp.projects}`,
      `- Hours Invested: ${this.progress.stats.cpp.hours}`,
      "## Projects",
      ...this.progress.projects.map(p =>
        `- **${p.name}** (${p.lang}): ${p.hours}h - ${p.completed ? 'Completed' : 'In Progress'}`
      ),
      "## System Design",
      `- Completed Designs: ${this.progress.stats.design}`,
      "## Mock Interviews",
      `- Completed Mocks: ${this.progress.stats.mocks}`
    ].join('\n');

    fs.writeFileSync('progress_report.md', report);
    console.log("📄 Report generated: progress_report.md");
  }
}

// CLI Handling
const [, , command, type, ...args] = process.argv;
const tracker = new FAANGTracker();

switch (command) {
  case 'tasks':
    tracker.showTasks();
    break;
  case 'log':
    if (type === 'lc') {
      tracker.logProgress('lc', {
        lang: args[0],
        count: parseInt(args[1]),
        difficulty: args[2]
      });
    } else if (type === 'project') {
      tracker.logProgress('project', {
        lang: args[0],
        name: args[1],
        hours: parseInt(args[2]) || 1,
        completed: args[3] === 'true'
      });
    }
    break;
  case 'stats':
    tracker.showStats();
    break;
  case 'report':
    tracker.generateReport();
    break;
  default:
    console.log(`Usage:
    node tracker.js tasks
    node tracker.js log lc [js|cpp] [count] [easy|medium|hard]
    node tracker.js log project [js|cpp] [project-name] [hours] [completed(true/false)]
    node tracker.js stats
    node tracker.js report`);
}