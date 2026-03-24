Component({
  properties: {
    statusText: { type: String, value: '' },
    statusHintText: { type: String, value: '' },
    canConfirm: { type: Boolean, value: false },
    canRewrite: { type: Boolean, value: true },
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
  },
  methods: {
    onConfirm() {
      this.triggerEvent('confirm')
    },
    onRewrite() {
      this.triggerEvent('rewrite')
    },
  },
})
