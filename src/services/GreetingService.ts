export class GreetingService {
  static getTimeBasedGreeting(employeeName: string): string {
    const hour = new Date().getHours();
    let greeting = '';

    if (hour >= 5 && hour < 12) {
      greeting = 'Good morning';
    } else if (hour >= 12 && hour < 17) {
      greeting = 'Good afternoon';
    } else if (hour >= 17 && hour < 21) {
      greeting = 'Good evening';
    } else {
      greeting = 'Good night';
    }

    return `${greeting}, ${employeeName}!`;
  }

  static getWelcomeMessage(employeeName: string, role: string): string {
    const timeGreeting = this.getTimeBasedGreeting(employeeName);
    return `${timeGreeting} Welcome to Tracko.`;
  }

  static getShiftGreeting(employeeName: string, shiftType: string): string {
    const timeGreeting = this.getTimeBasedGreeting(employeeName);
    return `${timeGreeting} Ready for your ${shiftType.toLowerCase()} shift?`;
  }

  static getMotivationalMessage(): string {
    const messages = [
      "Let's make today productive!",
      "Every shift counts towards success!",
      "Track your progress, achieve your goals!",
      "Excellence is a habit, not an act!",
      "Your dedication drives our success!",
      "Stay focused, stay motivated!",
      "Great work starts with great attitude!",
      "Make every moment count!",
      "Success is built one shift at a time!",
      "Your performance matters!"
    ];

    const randomIndex = Math.floor(Math.random() * messages.length);
    return messages[randomIndex];
  }

  static getPerformanceEncouragement(score: number, employeeName: string): string {
    if (score >= 90) {
      return `Outstanding work, ${employeeName}! You're setting the standard!`;
    } else if (score >= 80) {
      return `Great job, ${employeeName}! Keep up the excellent work!`;
    } else if (score >= 70) {
      return `Good progress, ${employeeName}! You're on the right track!`;
    } else if (score >= 60) {
      return `Keep pushing, ${employeeName}! Every improvement counts!`;
    } else {
      return `Don't give up, ${employeeName}! Tomorrow is a new opportunity!`;
    }
  }

  static getEndOfShiftMessage(employeeName: string): string {
    const hour = new Date().getHours();
    let message = '';

    if (hour >= 5 && hour < 12) {
      message = `Have a great day ahead, ${employeeName}!`;
    } else if (hour >= 12 && hour < 17) {
      message = `Enjoy your afternoon, ${employeeName}!`;
    } else if (hour >= 17 && hour < 21) {
      message = `Have a wonderful evening, ${employeeName}!`;
    } else {
      message = `Rest well, ${employeeName}!`;
    }

    return `Shift completed! ${message}`;
  }
}