<template>
  <div>
    <!-- 批量生成角色对话框 -->
    <el-dialog
      v-model="showBatchGenerate"
      title="批量生成角色"
      width="600px"
      @close="$emit('update:showBatchGenerate', false)"
    >
      <div class="batch-generate-form">
        <el-form :model="batchForm" label-width="100px">
          <el-form-item label="生成数量">
            <el-input-number v-model="batchForm.count" :min="1" :max="10" />
          </el-form-item>
          <el-form-item label="角色类型">
            <el-select v-model="batchForm.type" placeholder="请选择角色类型">
              <el-option label="主角" value="protagonist" />
              <el-option label="配角" value="supporting" />
              <el-option label="反派" value="antagonist" />
            </el-select>
          </el-form-item>
          <el-form-item label="描述">
            <el-input
              v-model="batchForm.description"
              type="textarea"
              :rows="3"
              placeholder="请输入角色描述要求"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="$emit('update:showBatchGenerate', false)">取消</el-button>
        <el-button type="primary" @click="handleBatchGenerate">生成</el-button>
      </template>
    </el-dialog>

    <!-- 续写对话框 -->
    <el-dialog
      v-model="showContinue"
      title="AI续写"
      width="800px"
      @close="$emit('update:showContinueDialog', false)"
    >
      <div class="continue-form">
        <el-form :model="continueForm" label-width="100px">
          <el-form-item label="续写长度">
            <el-select v-model="continueForm.length" placeholder="请选择续写长度">
              <el-option label="短篇 (200-500字)" value="short" />
              <el-option label="中篇 (500-1000字)" value="medium" />
              <el-option label="长篇 (1000-2000字)" value="long" />
            </el-select>
          </el-form-item>
          <el-form-item label="续写风格">
            <el-select v-model="continueForm.style" placeholder="请选择续写风格">
              <el-option label="保持原风格" value="original" />
              <el-option label="更加生动" value="vivid" />
              <el-option label="更加简洁" value="concise" />
            </el-select>
          </el-form-item>
          <el-form-item label="续写要求">
            <el-input
              v-model="continueForm.requirements"
              type="textarea"
              :rows="4"
              placeholder="请输入具体的续写要求..."
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="$emit('update:showContinueDialog', false)">取消</el-button>
        <el-button type="primary" @click="handleContinueWriting">开始续写</el-button>
      </template>
    </el-dialog>

    <!-- 世界观生成对话框 -->
    <el-dialog
      v-model="showWorldGenerate"
      title="生成世界观设定"
      width="700px"
      @close="$emit('update:showWorldGenerate', false)"
    >
      <div class="world-generate-form">
        <el-form :model="worldForm" label-width="100px">
          <el-form-item label="世界类型">
            <el-select v-model="worldForm.type" placeholder="请选择世界类型">
              <el-option label="现代都市" value="modern" />
              <el-option label="古代历史" value="historical" />
              <el-option label="奇幻魔法" value="fantasy" />
              <el-option label="科幻未来" value="scifi" />
            </el-select>
          </el-form-item>
          <el-form-item label="世界规模">
            <el-select v-model="worldForm.scale" placeholder="请选择世界规模">
              <el-option label="单一城市" value="city" />
              <el-option label="国家地区" value="country" />
              <el-option label="整个世界" value="world" />
              <el-option label="多元宇宙" value="multiverse" />
            </el-select>
          </el-form-item>
          <el-form-item label="特殊设定">
            <el-input
              v-model="worldForm.special"
              type="textarea"
              :rows="3"
              placeholder="请输入特殊的世界观设定要求..."
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="$emit('update:showWorldGenerate', false)">取消</el-button>
        <el-button type="primary" @click="handleWorldGenerate">生成</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  showBatchGenerate: Boolean,
  showContinueDialog: Boolean,
  showWorldGenerate: Boolean,
  currentChapter: Object,
  currentNovel: Object
})

const emit = defineEmits([
  'update:showBatchGenerate',
  'update:showContinueDialog', 
  'update:showWorldGenerate',
  'batch-generate-confirm',
  'continue-writing',
  'world-generate-confirm'
])

// 表单数据
const batchForm = ref({
  count: 3,
  type: '',
  description: ''
})

const continueForm = ref({
  length: 'medium',
  style: 'original',
  requirements: ''
})

const worldForm = ref({
  type: '',
  scale: '',
  special: ''
})

// 计算属性
const showBatchGenerate = computed({
  get: () => props.showBatchGenerate,
  set: (val) => emit('update:showBatchGenerate', val)
})

const showContinue = computed({
  get: () => props.showContinueDialog,
  set: (val) => emit('update:showContinueDialog', val)
})

const showWorldGenerate = computed({
  get: () => props.showWorldGenerate,
  set: (val) => emit('update:showWorldGenerate', val)
})

// 方法
const handleBatchGenerate = () => {
  emit('batch-generate-confirm', batchForm.value)
  showBatchGenerate.value = false
}

const handleContinueWriting = () => {
  emit('continue-writing', continueForm.value)
  showContinue.value = false
}

const handleWorldGenerate = () => {
  emit('world-generate-confirm', worldForm.value)
  showWorldGenerate.value = false
}
</script>

<style scoped>
.batch-generate-form,
.continue-form,
.world-generate-form {
  padding: 20px 0;
}
</style>