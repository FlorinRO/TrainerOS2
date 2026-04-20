import Card from '@/components/Card';

export default function Contact() {
  return (
    <div className="min-h-screen bg-dark-400 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <section className="text-center mb-12">
          <p className="text-brand-500 font-semibold mb-3">Contact</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white font-display mb-4">
            Hai să vorbim.
          </h1>
          <p className="text-gray-300 text-lg">
            Pentru suport, parteneriate sau întrebări comerciale, ne poți contacta direct.
          </p>
        </section>

        <div className="grid sm:grid-cols-2 gap-6">
          <Card>
            <h2 className="text-xl text-white font-bold mb-2">Suport Clienți</h2>
            <p className="text-gray-300 mb-3">Răspuns în general în 24 ore lucrătoare.</p>
            <a href="mailto:business@traineros.org" className="text-brand-500 hover:text-brand-400">
              business@traineros.org
            </a>
          </Card>

          <Card>
            <h2 className="text-xl text-white font-bold mb-2">Legal & GDPR</h2>
            <p className="text-gray-300 mb-3">Solicitări privind date personale și conformitate.</p>
            <a href="mailto:business@traineros.org" className="text-brand-500 hover:text-brand-400">
              business@traineros.org
            </a>
          </Card>

          <Card>
            <h2 className="text-xl text-white font-bold mb-2">Parteneriate</h2>
            <p className="text-gray-300 mb-3">Colaborări B2B, afiliere, integrații.</p>
            <a href="mailto:business@traineros.org" className="text-brand-500 hover:text-brand-400">
              business@traineros.org
            </a>
          </Card>

          <Card>
            <h2 className="text-xl text-white font-bold mb-2">Adresă companie</h2>
            <p className="text-gray-300">
              TrainerOS
              <br />
              Cluj, Romania
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
