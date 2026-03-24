Component({
  properties: {
    statusText: { type: String, value: '' },
    statusHintText: { type: String, value: '' },
    canConfirm: { type: Boolean, value: false },
    canRewrite: { type: Boolean, value: true },
    groupStatusCode: { type: String, value: '' },
    groupStatusText: { type: String, value: '' },
    myDecisionText: { type: String, value: '' },
    confirmedProgressText: { type: String, value: '' },
    totalBudgetText: { type: String, value: '' },
    introText: { type: String, value: '' },
    genderText: { type: String, value: '' },
    checkinCountText: { type: String, value: '' },
    lifestyleText: { type: String, value: '' },
    layoutText: { type: String, value: '' },
    roomTypeText: { type: String, value: '' },
    agencyFeeText: { type: String, value: '' },
    budgetText: { type: String, value: '' },
    checkinDateText: { type: String, value: '' },
    hasCurrentGroup: { type: Boolean, value: false },
    currentGroupMembers: { type: Array, value: [] },
    isConfirming: { type: Boolean, value: false },
    rejectingMatchId: { type: String, value: '' },
  },
  methods: {
    onConfirm() {
      this.triggerEvent('confirm')
    },
    onReject(e: WechatMiniprogram.BaseEvent<{ matchId?: string }>) {
      const matchId = String(e.currentTarget.dataset.matchId || '')
      if (!matchId) return

      this.triggerEvent('reject', { matchId })
    },
    onRewrite() {
      this.triggerEvent('rewrite')
    },
  },
})
