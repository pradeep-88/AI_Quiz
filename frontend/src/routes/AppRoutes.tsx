import { Routes, Route } from 'react-router-dom'
import { Home } from '../pages/Home'
import { JoinQuiz } from '../pages/JoinQuiz'
import { HostLayout } from '../components/layout/HostLayout'
import { HostCreate } from '../pages/host/HostCreate'
import { HostLobby } from '../pages/host/HostLobby'
import { HostQuiz } from '../pages/host/HostQuiz'
import { HostResults } from '../pages/host/HostResults'
import { PlayerWaiting } from '../pages/player/PlayerWaiting'
import { PlayerQuiz } from '../pages/player/PlayerQuiz'
import { PlayerResults } from '../pages/player/PlayerResults'
import { PlayerReview } from '../pages/player/PlayerReview'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/host" element={<HostLayout />}>
        <Route path="create" element={<HostCreate />} />
        <Route path="lobby/:roomCode" element={<HostLobby />} />
        <Route path="quiz/:roomCode" element={<HostQuiz />} />
        <Route path="results/:roomCode" element={<HostResults />} />
      </Route>
      <Route path="/join" element={<JoinQuiz />} />
      <Route path="/player/waiting/:roomCode" element={<PlayerWaiting />} />
      <Route path="/player/quiz/:roomCode" element={<PlayerQuiz />} />
      <Route path="/player/results/:roomCode" element={<PlayerResults />} />
      <Route path="/player/review/:roomCode" element={<PlayerReview />} />
    </Routes>
  )
}
