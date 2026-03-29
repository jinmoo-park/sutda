from PIL import Image
import os

def trim_and_resize_cards_ultra_tight():
    # 처리할 20개의 파일명 리스트 생성
    files = [f"{i:02d}-{j}.png" for i in range(1, 11) for j in (1, 2)]
    
    # final 폴더 생성 (이미 존재해도 오류 안 남)
    output_dir = "final"
    os.makedirs(output_dir, exist_ok=True)
    
    trimmed_images = {}
    max_width = 0
    max_height = 0
    
    # 💡 핵심 설정: 투명도 임계값 (0-255). 높을수록 더 타이트하게 내용물만 자릅니다.
    # 사용자의 이미지 테두리가 흐릿하므로 임계값을 높이는 것이 해결책입니다.
    ALPHA_THRESHOLD = 200 
    
    print(f"🔍 1단계: 임계값 {ALPHA_THRESHOLD}로 테두리를 아주 타이트하게 잘라내고 있습니다...")
    
    # 1단계: 투명 여백 바짝 자르기 및 최대 크기 찾기
    for file in files:
        if not os.path.exists(file):
            print(f"⚠️ 경고: '{file}' 파일을 찾을 수 없어 건너뜁니다.")
            continue
            
        img = Image.open(file).convert("RGBA")
        
        # 투명도(Alpha) 채널을 가져옵니다.
        alpha_channel = img.split()[-1]
        
        # 💡 수정된 핵심 로직: 투명도 채널에 임계값을 적용하여 흐릿한 테두리를 무시합니다.
        alpha_thresholded = alpha_channel.point(lambda p: 255 if p > ALPHA_THRESHOLD else 0)
        
        # 수정된 알파 채널에서 경계 상자(Bounding Box) 찾기
        bbox = alpha_thresholded.getbbox()
        
        if bbox:
            # 더 타이트해진 좌표로 자릅니다.
            trimmed = img.crop(bbox)
        else:
            trimmed = img
            
        trimmed_images[file] = trimmed
        
        # 가장 큰 가로, 세로 길이 업데이트
        if trimmed.width > max_width: max_width = trimmed.width
        if trimmed.height > max_height: max_height = trimmed.height

    if max_width == 0 or max_height == 0:
        print("❌ 오류: 유효한 이미지를 찾을 수 없습니다.")
        return

    print(f"📏 기준 사이즈 결정: 가로 {max_width}px, 세로 {max_height}px\n")
    print(f"📁 2단계: '{output_dir}' 폴더에 여백 없이 꽉 채워 저장합니다...")

    # 2단계: 여백 추가 없이, 이미지를 강제로 늘리거나 줄여서 사이즈 완전 통일
    for file, trimmed_img in trimmed_images.items():
        # LANCZOS 필터를 적용해 크기를 조절할 때 화질 손상을 최소화합니다.
        final_img = trimmed_img.resize((max_width, max_height), Image.Resampling.LANCZOS)
        
        # final 폴더 경로에 기존 파일명 그대로 저장
        out_path = os.path.join(output_dir, file)
        final_img.save(out_path)
        
        print(f"✅ 저장 완료: {out_path}")

# 스크립트 실행
if __name__ == "__main__":
    print("정밀 타이트 자르기 작업을 시작합니다...")
    trim_and_resize_cards_ultra_tight()
    print("\n🎉 모든 작업이 완료되었습니다! final 폴더를 확인해 보세요.")