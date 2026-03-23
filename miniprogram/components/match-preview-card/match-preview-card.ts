Component({
  properties: {
    statusText: { type: String, value: '' },
    introText: { type: String, value: '' },
    genderText: { type: String, value: '' },
    checkinCountText: { type: String, value: '' },
    lifestyleText: { type: String, value: '' },
    layoutText: { type: String, value: '' },
    roomTypeText: { type: String, value: '' },
    agencyFeeText: { type: String, value: '' },
    budgetText: { type: String, value: '' },
    checkinDateText: { type: String, value: '' },
  },
  methods: {
    onRewrite() {
      this.triggerEvent('rewrite')
    },
  },
})
