export class Subrequests {
  total = 0
  notifiedCount = 0
  requiredCount = 0

  required(count = 1) {
    this.requiredCount += count
    this.total += count
  }

  checked(count = 1) {
    this.total += count
  }

  notified() {
    this.notifiedCount += 1
    this.total += 1
  }
}
