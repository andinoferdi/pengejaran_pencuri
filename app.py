from flask import Flask, render_template, request, jsonify
import random

app = Flask(__name__)

# Graf jalur
jalur = {
    "A": ["B", "C"], "B": ["A", "D", "E"], "C": ["A", "F"],
    "D": ["B", "G"], "E": ["B", "F", "H"], "F": ["C", "E", "I"],
    "G": ["D"], "H": ["E", "I", "J"], "I": ["F", "H", "K"],
    "J": ["H", "L"], "K": ["I", "L"], "L": ["J", "K", "HOME"],
    "HOME": ["L"]
}

# Posisi node (untuk dikirim ke client)
posisi = {
    "A": [300, 100], "B": [200, 200], "C": [400, 200],
    "D": [150, 300], "E": [250, 300], "F": [400, 300],
    "G": [100, 400], "H": [300, 400], "I": [450, 400],
    "J": [250, 500], "K": [400, 500], "L": [325, 550],
    "HOME": [325, 600]
}

# State permainan
pencuriPos = "A"
polisiPos = "HOME"
game_over = False
debug_info = []  # Untuk menyimpan informasi debug

# BFS untuk jalur terpendek
def bfs(start, goal):
    from collections import deque
    queue = deque([[start]])
    visited = set()
    
    while queue:
        path = queue.popleft()
        node = path[-1]
        if node == goal:
            return path[1] if len(path) > 1 else None
        if node not in visited:
            visited.add(node)
            for neighbor in jalur.get(node, []):
                queue.append(path + [neighbor])
    return None

# BFS untuk mendapatkan jalur lengkap
def bfs_full_path(start, goal):
    from collections import deque
    queue = deque([[start]])
    visited = set()
    
    while queue:
        path = queue.popleft()
        node = path[-1]
        if node == goal:
            return path
        if node not in visited:
            visited.add(node)
            for neighbor in jalur.get(node, []):
                new_path = list(path)
                new_path.append(neighbor)
                queue.append(new_path)
    return None

# Fungsi untuk menghitung jarak antar node
def calculate_distance(node1, node2):
    path = bfs_full_path(node1, node2)
    return len(path) - 1 if path else float('inf')

# Ubah fungsi get_pencuri_move() untuk meningkatkan deteksi bahaya

def get_pencuri_move():
  global pencuriPos, polisiPos, debug_info
  
  debug_info = []  # Reset debug info
  debug_info.append(f"Pencuri di {pencuriPos}, Polisi di {polisiPos}")
  
  # Dapatkan semua langkah yang mungkin
  possible_moves = jalur.get(pencuriPos, [])
  if not possible_moves:
      debug_info.append("Tidak ada langkah yang mungkin")
      return None
  
  # DETEKSI BAHAYA YANG DITINGKATKAN
  # 1. Bahaya Langsung: Polisi berdekatan (adjacent)
  direct_danger = polisiPos in possible_moves
  
  # 2. Bahaya Tidak Langsung: Polisi dapat mencapai pencuri dalam 2 langkah
  indirect_danger = False
  police_two_step_moves = []
  
  # Kumpulkan semua node yang dapat dicapai polisi dalam 2 langkah
  for police_adjacent in jalur.get(polisiPos, []):
      police_two_step_moves.append(police_adjacent)
      for next_move in jalur.get(police_adjacent, []):
          if next_move != polisiPos and next_move not in police_two_step_moves:
              police_two_step_moves.append(next_move)
  
  # Periksa apakah pencuri berada dalam jangkauan 2 langkah polisi
  if pencuriPos in police_two_step_moves:
      indirect_danger = True
      debug_info.append(f"WASPADA! Polisi dapat mencapai posisi dalam 2 langkah")
  
  # Tentukan tingkat bahaya
  if direct_danger:
      debug_info.append("BAHAYA TINGGI! Polisi berdekatan!")
      danger_level = "high"
  elif indirect_danger:
      debug_info.append("BAHAYA SEDANG! Polisi dekat!")
      danger_level = "medium"
  else:
      danger_level = "low"
      debug_info.append("Situasi aman, tidak ada bahaya langsung")
  
  # KASUS BAHAYA TINGGI: Polisi berdekatan (adjacent)
  if direct_danger:
      # Hapus langkah yang mengarah ke polisi
      safe_moves = [move for move in possible_moves if move != polisiPos]
      
      if not safe_moves:
          debug_info.append("Terjebak! Tidak ada langkah aman")
          return random.choice(possible_moves)  # Terpaksa bergerak acak
      
      # KASUS KHUSUS BERDASARKAN POSISI
      # Kasus F-E: Pencuri di F, Polisi di E
      if pencuriPos == "F" and polisiPos == "E":
          debug_info.append("Kasus khusus F-E terdeteksi")
          if "I" in safe_moves:
              debug_info.append("Memilih I sebagai jalur pelarian terbaik")
              return "I"
      
      # Kasus C-A: Pencuri di C, Polisi di A
      elif pencuriPos == "C" and polisiPos == "A":
          debug_info.append("Kasus khusus C-A terdeteksi")
          if "F" in safe_moves:
              debug_info.append("Memilih F sebagai jalur pelarian terbaik")
              return "F"
      
      # Kasus B-A: Pencuri di B, Polisi di A
      elif pencuriPos == "B" and polisiPos == "A":
          debug_info.append("Kasus khusus B-A terdeteksi")
          if "E" in safe_moves:
              debug_info.append("Memilih E sebagai jalur pelarian terbaik")
              return "E"
      
      # Kasus I-F: Pencuri di I, Polisi di F
      elif pencuriPos == "I" and polisiPos == "F":
          debug_info.append("Kasus khusus I-F terdeteksi")
          if "K" in safe_moves:
              debug_info.append("Memilih K sebagai jalur pelarian terbaik")
              return "K"
      
      # Kasus I-H: Pencuri di I, Polisi di H
      elif pencuriPos == "I" and polisiPos == "H":
          debug_info.append("Kasus khusus I-H terdeteksi")
          if "K" in safe_moves:
              debug_info.append("Memilih K sebagai jalur pelarian terbaik")
              return "K"
      
      # Kasus E-B: Pencuri di E, Polisi di B
      elif pencuriPos == "E" and polisiPos == "B":
          debug_info.append("Kasus khusus E-B terdeteksi")
          if "H" in safe_moves:
              debug_info.append("Memilih H sebagai jalur pelarian terbaik")
              return "H"
      
      # Evaluasi langkah aman berdasarkan jarak ke HOME dan keamanan
      best_move = None
      best_score = -float('inf')
      
      for move in safe_moves:
          # Jarak ke HOME
          dist_to_home = calculate_distance(move, "HOME")
          
          # Jarak ke polisi setelah bergerak
          future_police_moves = jalur.get(polisiPos, [])
          min_dist_to_police = float('inf')
          
          for police_move in future_police_moves:
              dist = calculate_distance(move, police_move)
              min_dist_to_police = min(min_dist_to_police, dist)
          
          # Skor: prioritaskan keamanan (4x) dan jarak ke HOME (1x)
          safety_score = min_dist_to_police * 4  # Meningkatkan bobot keamanan
          goal_score = (10 - min(dist_to_home, 10))
          
          # Bonus untuk langkah yang menjauh dari polisi
          direction_bonus = 0
          if move in police_two_step_moves:
              direction_bonus = -5  # Penalti jika masih dalam jangkauan 2 langkah
          else:
              direction_bonus = 5   # Bonus jika keluar dari jangkauan 2 langkah
          
          score = safety_score + goal_score + direction_bonus
          
          debug_info.append(f"Evaluasi {move}: safety={safety_score}, goal={goal_score}, direction={direction_bonus}, total={score}")
          
          if score > best_score:
              best_score = score
              best_move = move
      
      debug_info.append(f"Memilih langkah aman terbaik: {best_move} (skor: {best_score})")
      return best_move
  
  # KASUS BAHAYA SEDANG: Polisi dekat tapi tidak berdekatan
  elif indirect_danger:
      # Evaluasi semua langkah dengan prioritas menjauh dari polisi
      move_scores = []
      
      for move in possible_moves:
          # Jarak ke HOME
          dist_to_home = calculate_distance(move, "HOME")
          
          # Jarak ke polisi setelah bergerak
          dist_to_police = calculate_distance(move, polisiPos)
          
          # Jarak polisi ke HOME melalui langkah ini
          police_to_move_to_home = calculate_distance(polisiPos, move) + calculate_distance(move, "HOME")
          
          # Faktor keamanan: jarak ke polisi (bobot 3x)
          safety_score = dist_to_police * 3
          
          # Faktor efisiensi: jarak ke HOME (bobot 1x)
          efficiency_score = 10 - min(dist_to_home, 10)
          
          # Faktor strategis: apakah polisi bisa memotong jalur (bobot 2x)
          strategic_score = 0
          if police_to_move_to_home > dist_to_home + dist_to_police:
              strategic_score = 10  # Bonus besar jika pencuri bisa mencapai HOME sebelum polisi
          
          # Penalti untuk langkah yang masih dalam jangkauan 2 langkah polisi
          danger_penalty = 0
          if move in police_two_step_moves:
              danger_penalty = -5
          
          # Skor total
          total_score = safety_score + efficiency_score + (strategic_score * 2) + danger_penalty
          
          # Tambahkan sedikit keacakan untuk menghindari pola yang mudah diprediksi
          randomness = random.uniform(0, 0.5)  # Kurangi keacakan
          total_score += randomness
          
          move_scores.append((move, total_score))
          debug_info.append(f"Skor {move}: safety={safety_score}, efficiency={efficiency_score}, strategic={strategic_score}, danger={danger_penalty}, total={total_score}")
      
      # Pilih langkah dengan skor tertinggi
      move_scores.sort(key=lambda x: x[1], reverse=True)
      best_move = move_scores[0][0]
      
      debug_info.append(f"Memilih langkah terbaik: {best_move} (skor: {move_scores[0][1]})")
      return best_move
  
  # KASUS NORMAL: Polisi jauh
  else:
      # Hitung jarak ke HOME dan ke polisi untuk setiap langkah
      move_scores = []
      
      for move in possible_moves:
          # Jarak ke HOME (lebih kecil lebih baik)
          dist_to_home = calculate_distance(move, "HOME")
          
          # Jarak ke polisi (lebih besar lebih baik)
          dist_to_police = calculate_distance(move, polisiPos)
          
          # Jarak polisi ke HOME melalui langkah ini
          police_to_move_to_home = calculate_distance(polisiPos, move) + calculate_distance(move, "HOME")
          
          # Hitung skor untuk langkah ini
          # Prioritaskan langkah yang menjauh dari polisi dan mendekati HOME
          
          # Faktor keamanan: jarak ke polisi (bobot 2x)
          safety_score = dist_to_police * 2
          
          # Faktor efisiensi: jarak ke HOME (bobot 2x)
          efficiency_score = (10 - min(dist_to_home, 10)) * 2
          
          # Faktor strategis: apakah polisi bisa memotong jalur (bobot 2x)
          strategic_score = 0
          if police_to_move_to_home > dist_to_home + dist_to_police:
              strategic_score = 10  # Bonus besar jika pencuri bisa mencapai HOME sebelum polisi
          
          # Skor total
          total_score = safety_score + efficiency_score + (strategic_score * 2)
          
          # Tambahkan sedikit keacakan untuk menghindari pola yang mudah diprediksi
          randomness = random.uniform(0, 0.5)  # Kurangi keacakan
          total_score += randomness
          
          move_scores.append((move, total_score))
          debug_info.append(f"Skor {move}: safety={safety_score}, efficiency={efficiency_score}, strategic={strategic_score}, total={total_score}")
      
      # Pilih langkah dengan skor tertinggi
      move_scores.sort(key=lambda x: x[1], reverse=True)
      best_move = move_scores[0][0]
      
      debug_info.append(f"Memilih langkah terbaik: {best_move} (skor: {move_scores[0][1]})")
      return best_move

@app.route('/')
def index():
    return render_template('index.html', posisi=posisi, jalur=jalur)

@app.route('/move', methods=['POST'])
def move():
    global pencuriPos, polisiPos, game_over
    
    if game_over:
        return jsonify({"status": "game_over"})
    
    # Polisi bergerak berdasarkan input pemain
    clicked_node = request.json['node']
    
    # Cek apakah langkah polisi valid
    if clicked_node in jalur[polisiPos]:
        polisiPos = clicked_node
        
        # Cek apakah polisi menangkap pencuri
        if polisiPos == pencuriPos:
            game_over = True
            return jsonify({
                "pencuri_pos": pencuriPos,
                "polisi_pos": polisiPos,
                "message": "Polisi Menang! 🚨",
                "game_over": True
            })
        
        # Pencuri bergerak otomatis
        next_pencuri_move = get_pencuri_move()
        if next_pencuri_move:
            pencuriPos = next_pencuri_move
            
            # Cek apakah pencuri mencapai HOME
            if pencuriPos == "HOME":
                game_over = True
                return jsonify({
                    "pencuri_pos": pencuriPos,
                    "polisi_pos": polisiPos,
                    "message": "Pencuri Menang! 🎉",
                    "game_over": True,
                    "debug_info": debug_info
                })
            
            # Cek apakah polisi menangkap pencuri setelah pencuri bergerak
            if polisiPos == pencuriPos:
                game_over = True
                return jsonify({
                    "pencuri_pos": pencuriPos,
                    "polisi_pos": polisiPos,
                    "message": "Polisi Menang! 🚨",
                    "game_over": True,
                    "debug_info": debug_info
                })
        
        return jsonify({
            "pencuri_pos": pencuriPos,
            "polisi_pos": polisiPos,
            "game_over": False,
            "debug_info": debug_info
        })
    
    return jsonify({"status": "invalid_move"})

@app.route('/restart', methods=['POST'])
def restart():
    global pencuriPos, polisiPos, game_over
    pencuriPos = "A"
    polisiPos = "HOME"
    game_over = False
    return jsonify({
        "pencuri_pos": pencuriPos,
        "polisi_pos": polisiPos,
        "game_over": False
    })

if __name__ == '__main__':
    app.run(debug=True)

